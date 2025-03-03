import type { Ref } from 'vue'
import {
  DerivativeOrderSide,
  UiPriceLevel,
  UiDerivativeMarketWithToken,
  ZERO_IN_BASE
} from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase, BigNumberInWei } from '@injectivelabs/utils'
import { ONE_IN_BASE } from '@/app/utils/constants'
import {
  calculateAveragePrice,
  calculateWorstPrice
} from '@/app/client/utils/orderbook'
import { TradeExecutionType, TradeField, TradeForm } from '@/types'

export function useDerivativePrice({
  formValues,
  isBase,
  market
}: {
  formValues: Ref<TradeForm>
  isBase: Ref<boolean>
  market: Ref<UiDerivativeMarketWithToken>
}) {
  const derivativeStore = useDerivativeStore()
  const positionStore = usePositionStore()

  const isBuy = computed(
    () => formValues.value[TradeField.OrderType] === DerivativeOrderSide.Buy
  )

  const orderbookOrders = computed<UiPriceLevel[] | undefined>(() =>
    isBuy.value
      ? derivativeStore.orderbook?.sells
      : derivativeStore.orderbook?.buys
  )

  const amountForCalculation = computed(() => {
    const amount = isBase.value
      ? formValues.value[TradeField.BaseAmount]
      : formValues.value[TradeField.QuoteAmount]

    if (!amount) {
      return ONE_IN_BASE
    }

    const amountInBigNumber = new BigNumberInBase(amount)

    if (amountInBigNumber.eq(0) || amountInBigNumber.isNaN()) {
      return ONE_IN_BASE
    }

    return amountInBigNumber
  })

  /*
    Buy: (1 + slippage_tolerance)
    Sell: (1 - slippage_tolerance)
  */
  const slippage = computed(() => {
    const slippage = new BigNumberInBase(
      formValues.value[TradeField.SlippageTolerance] || '0'
    ).div(100)

    return isBuy.value
      ? ONE_IN_BASE.plus(slippage)
      : ONE_IN_BASE.minus(slippage)
  })

  const averagePrice = computed(() => {
    if (
      amountForCalculation.value.lte(0) ||
      !market.value ||
      !orderbookOrders.value ||
      orderbookOrders.value.length === 0
    ) {
      return ZERO_IN_BASE
    }

    const { filledNotional, totalFilledBaseQuantity } = calculateAveragePrice({
      isBase: isBase.value,
      isSpot: false,
      records: orderbookOrders.value,
      quantity: amountForCalculation.value,
      market: market.value
    })

    return filledNotional.dividedBy(totalFilledBaseQuantity)
  })

  const worstPrice = computed(() => {
    if (
      amountForCalculation.value.lte(0) ||
      !market.value ||
      !orderbookOrders.value ||
      orderbookOrders.value.length === 0
    ) {
      return ZERO_IN_BASE
    }

    const { worstPrice } = calculateWorstPrice({
      isBase: isBase.value,
      isSpot: false,
      records: orderbookOrders.value,
      quantity: amountForCalculation.value,
      market: market.value
    })

    return worstPrice
  })

  const maxAmountOnOrderbook = computed(() => {
    if (!orderbookOrders.value) {
      return { totalNotional: ZERO_IN_BASE, totalQuantity: ZERO_IN_BASE }
    }

    const { quoteToken } = market.value

    const { totalNotional, totalQuantity } = orderbookOrders.value.reduce(
      ({ totalNotional, totalQuantity }, { quantity, price }) => {
        const orderPrice = new BigNumberInWei(price).toBase(quoteToken.decimals)
        const orderQuantity = new BigNumberInBase(quantity)

        return {
          totalQuantity: totalQuantity.plus(orderQuantity),
          totalNotional: totalNotional.plus(orderQuantity.times(orderPrice))
        }
      },
      { totalNotional: ZERO_IN_BASE, totalQuantity: ZERO_IN_BASE }
    )

    return { totalNotional, totalQuantity }
  })

  const maxReduceOnly = computed(() => {
    if (positionStore.subaccountPositions.length === 0) {
      return
    }

    const position = positionStore.subaccountPositions.find(
      (position) => position.marketId === market.value.marketId
    )

    if (!position) {
      return ZERO_IN_BASE
    }

    const reduceOnlyOrders = derivativeStore.subaccountOrders.filter(
      (o) => o.isReduceOnly && o.marketId === market.value.marketId
    )

    const aggregateReduceOnlyQuantity = reduceOnlyOrders.reduce(
      (total, order) => total.plus(order.quantity),
      ZERO_IN_BASE
    )

    const reduceOnlyAmount = new BigNumberInBase(position.quantity).minus(
      aggregateReduceOnlyQuantity
    )

    const { totalQuantity } = maxAmountOnOrderbook.value

    return reduceOnlyAmount.gt(totalQuantity) ? totalQuantity : reduceOnlyAmount
  })

  const averagePriceWithSlippage = computed<BigNumberInBase>(() => {
    const { priceDecimals, quantityDecimals } = market.value
    const decimalPlaces = isBase ? priceDecimals : quantityDecimals

    return new BigNumberInBase(
      averagePrice.value.times(slippage.value).toFixed(decimalPlaces)
    )
  })

  const tradingTypeStopMarket = computed(
    () =>
      formValues.value[TradeField.TradingType] === TradeExecutionType.StopMarket
  )

  const worstPriceWithSlippage = computed<BigNumberInBase>(() => {
    if (tradingTypeStopMarket.value) {
      if (!formValues.value[TradeField.TriggerPrice]) {
        return ZERO_IN_BASE
      }

      return new BigNumberInBase(
        new BigNumberInBase(formValues.value[TradeField.TriggerPrice])
          .times(slippage.value)
          .toFixed(market.value.priceDecimals)
      )
    }

    const { priceDecimals, quantityDecimals } = market.value
    const decimalPlaces = isBase ? priceDecimals : quantityDecimals

    return new BigNumberInBase(
      worstPrice.value.times(slippage.value).toFixed(decimalPlaces)
    )
  })

  return {
    amountForCalculation,
    averagePrice,
    averagePriceWithSlippage,
    maxAmountOnOrderbook,
    maxReduceOnly,
    slippage,
    worstPrice,
    worstPriceWithSlippage
  }
}
