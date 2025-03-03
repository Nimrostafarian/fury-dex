import type { Ref } from 'vue'
import {
  DerivativeOrderSide,
  SpotOrderSide,
  UiDerivativeOrderHistory,
  UiSpotMarketWithToken,
  UiSpotOrderHistory,
  ZERO_IN_BASE
} from '@injectivelabs/sdk-ui-ts'
import { TradeExecutionType } from '@injectivelabs/ts-types'
import { BigNumberInBase, BigNumberInWei } from '@injectivelabs/utils'
import { format } from 'date-fns'
import { DerivativeOrderState, SpotOrderState } from '@injectivelabs/sdk-ts'
import { UiMarketWithToken } from '@/types'
import {
  UI_DEFAULT_AMOUNT_DISPLAY_DECIMALS,
  UI_DEFAULT_PRICE_DISPLAY_DECIMALS
} from '@/app/utils/constants'

export function useOrderHistory(
  order: Ref<UiDerivativeOrderHistory | UiSpotOrderHistory>,
  isSpot: Ref<boolean>
) {
  const derivativeStore = useDerivativeStore()
  const spotStore = useSpotStore()
  const { t } = useLang()

  const markets: UiMarketWithToken[] = isSpot.value
    ? spotStore.markets
    : derivativeStore.markets

  const market = computed(() =>
    markets.find((m) => m.marketId === order.value.marketId)
  )

  const isMarketOrder = computed(
    () => order.value.executionType === TradeExecutionType.Market
  )

  const isReduceOnly = computed(() => {
    if (!isSpot.value || !margin.value) {
      return false
    }

    return (
      (order.value as UiDerivativeOrderHistory).isReduceOnly ||
      margin.value.isZero()
    )
  })

  const priceDecimals = computed(() => {
    return market.value
      ? market.value.priceDecimals
      : UI_DEFAULT_PRICE_DISPLAY_DECIMALS
  })

  const quantityDecimals = computed(() => {
    return market.value
      ? market.value.quantityDecimals
      : UI_DEFAULT_AMOUNT_DISPLAY_DECIMALS
  })

  const price = computed(() => {
    if (!market.value) {
      return ZERO_IN_BASE
    }

    return isSpot.value && market.value.baseToken
      ? new BigNumberInBase(
          new BigNumberInBase(order.value.price).toWei(
            market.value.baseToken.decimals - market.value.quoteToken.decimals
          )
        )
      : new BigNumberInWei(order.value.price).toBase(
          market.value.quoteToken.decimals
        )
  })

  const triggerPrice = computed(() => {
    if (isSpot.value || !market.value) {
      return ZERO_IN_BASE
    }

    return new BigNumberInWei(
      (order.value as UiDerivativeOrderHistory).triggerPrice
    ).toBase(market.value.quoteToken.decimals)
  })

  const margin = computed(() => {
    if (!market.value || !isSpot.value) {
      return ZERO_IN_BASE
    }

    return new BigNumberInWei(
      (order.value as UiDerivativeOrderHistory).margin
    ).toBase(market.value.quoteToken.decimals)
  })

  const quantity = computed(() => {
    if (!market.value) {
      return ZERO_IN_BASE
    }

    return isSpot.value
      ? new BigNumberInWei(order.value.quantity).toBase(
          (market.value as UiSpotMarketWithToken).baseToken.decimals
        )
      : new BigNumberInBase(order.value.quantity)
  })

  const total = computed(() => price.value.multipliedBy(quantity.value))

  const filledQuantity = computed(() => {
    return isSpot
      ? new BigNumberInWei(order.value.filledQuantity).toBase(
          (market.value as UiMarketWithToken).baseToken.decimals
        )
      : new BigNumberInBase(order.value.filledQuantity)
  })

  const leverage = computed(() => {
    if (isReduceOnly.value) {
      return new BigNumberInBase('')
    }
    return new BigNumberInBase(
      price.value.times(quantity.value).dividedBy(margin.value)
    )
  })

  const isBuy = computed(() => {
    if (order.value.direction === SpotOrderSide.Buy) {
      return true
    }

    switch (order.value.orderType) {
      case SpotOrderSide.TakeBuy:
      case SpotOrderSide.StopBuy:
      case SpotOrderSide.Buy:
      case SpotOrderSide.BuyPO:
        return true
      default:
        return false
    }
  })

  const isStopLoss = computed(() => {
    const derivativeOrder = order.value as UiDerivativeOrderHistory

    return (
      derivativeOrder.orderType === DerivativeOrderSide.StopBuy ||
      derivativeOrder.orderType === DerivativeOrderSide.StopSell
    )
  })

  const isTakeProfit = computed(() => {
    const derivativeOrder = order.value as UiDerivativeOrderHistory

    return (
      derivativeOrder.orderType === DerivativeOrderSide.TakeBuy ||
      derivativeOrder.orderType === DerivativeOrderSide.TakeSell
    )
  })

  const timestamp = computed(() =>
    format(order.value.createdAt, 'dd MMM HH:mm:ss')
  )

  const type = computed(() => {
    const executionType =
      order.value.executionType === TradeExecutionType.Market
        ? t('trade.market')
        : t('trade.limit')

    switch (order.value.orderType) {
      case SpotOrderSide.Buy:
      case SpotOrderSide.Sell:
      case SpotOrderSide.BuyPO:
      case SpotOrderSide.SellPO:
        return executionType
      case SpotOrderSide.TakeSell:
      case SpotOrderSide.TakeBuy:
        return `${t('trade.takeProfit')} ${executionType}`
      case SpotOrderSide.StopSell:
      case SpotOrderSide.StopBuy:
        return `${t('trade.stopLoss')} ${executionType}`
      default:
        return ''
    }
  })

  const orderStatus = computed(() => {
    const orderState = isSpot.value ? SpotOrderState : DerivativeOrderState

    switch (order.value.state) {
      case orderState.Booked:
        return t('trade.open')
      case orderState.PartiallyFilled:
        return t('trade.partiallyFilled')
      case orderState.Filled:
        return t('trade.filled')
      case orderState.Canceled:
        return t('trade.cancelled')
      default: {
        return ''
      }
    }
  })

  return {
    type,
    isBuy,
    total,
    price,
    margin,
    market,
    quantity,
    leverage,
    timestamp,
    isStopLoss,
    orderStatus,
    isTakeProfit,
    triggerPrice,
    isReduceOnly,
    priceDecimals,
    isMarketOrder,
    filledQuantity,
    quantityDecimals
  }
}
