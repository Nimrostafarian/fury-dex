<script lang="ts" setup>
import { PropType } from 'vue'
import { BigNumberInBase } from '@injectivelabs/utils'
import { ZERO_IN_BASE, MarketType } from '@injectivelabs/sdk-ui-ts'
import { TRADE_FORM_PRICE_ROUNDING_MODE } from '@/app/utils/constants'
import { TradeField, TradeForm, UiMarketWithToken } from '@/types'

const isProduction = process.env.NODE_ENV === 'production'
const isWebpack = process.env.BUILDER_TYPE === 'webpack' || isProduction

const props = defineProps({
  isBuy: Boolean,
  orderTypeReduceOnly: Boolean,

  executionPrice: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  fees: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  feeRate: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  formValues: {
    type: Object as PropType<TradeForm>,
    required: true
  },

  liquidationPrice: {
    type: Object as PropType<BigNumberInBase> | undefined,
    default: undefined
  },

  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  },

  notionalValue: {
    type: Object as PropType<BigNumberInBase>,
    default: undefined
  },

  notionalWithFees: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  slippage: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  }
})

const isSpot = props.market.type === MarketType.Spot

const {
  baseAmount: derivativeBaseAmount,
  quoteAmount: derivativeQuoteAmount,
  tradingTypeLimit: derivativeTradingTypeLimit,
  tradingTypeMarket: derivativeTradingTypeMarket
} = useDerivativeFormFormatter(computed(() => props.formValues))

const {
  baseAmount: spotBaseAmount,
  quoteAmount: spotQuoteAmount,
  tradingTypeLimit: spotTradingTypeLimit,
  tradingTypeMarket: spotTradingTypeMarket
} = useSpotFormFormatter(computed(() => props.formValues))

const tradingTypeLimit = isSpot
  ? spotTradingTypeLimit
  : derivativeTradingTypeLimit
const tradingTypeMarket = isSpot
  ? spotTradingTypeMarket
  : derivativeTradingTypeMarket

const orderDetailsComponentPath = computed(() => {
  const componentName =
    tradingTypeMarket.value || tradingTypeLimit.value
      ? 'OrderDetails'
      : 'ConditionalOrderDetails'

  const spotPath = `Spot/Trading/${componentName}`
  const derivativePath = `Derivatives/Trading/${componentName}`

  return isSpot ? spotPath : derivativePath
})

const orderDetailsComponent = defineAsyncComponent(() => {
  return new Promise((resolve, _reject) => {
    if (!isWebpack) {
      const comps = import.meta.glob(/* @vite-ignore */ './../**/*.vue')

      return comps[
        /* @vite-ignore */ `../${orderDetailsComponentPath.value}.vue`
      ]().then((component) => resolve(component.default))
    }

    // webpack
    import(/* @vite-ignore */ `../${orderDetailsComponentPath.value}.vue`).then(
      (component) => resolve(component)
    )
  })
})

const { valueToString: executionPriceToFormat } = useBigNumberFormatter(
  computed(() => props.executionPrice),
  {
    decimalPlaces: props.market.priceDecimals,
    roundingMode: TRADE_FORM_PRICE_ROUNDING_MODE
  }
)

const { valueToString: notionalWithFeesToFormat } = useBigNumberFormatter(
  computed(() => props.notionalWithFees),
  {
    decimalPlaces: props.market.priceDecimals
  }
)

const minimumReceivedAmount = computed(() => {
  if (props.executionPrice.lte('0')) {
    return ZERO_IN_BASE
  }

  const baseAmount = isSpot ? spotBaseAmount : derivativeBaseAmount
  const quoteAmount = isSpot ? spotQuoteAmount : derivativeQuoteAmount
  const feeMultiplier = new BigNumberInBase(1).minus(props.feeRate)

  const minimumReceivedBaseAmount = isSpot
    ? baseAmount.value.times(props.executionPrice).times(feeMultiplier)
    : baseAmount.value.times(props.executionPrice)
  const minimumReceivedQuoteAmount = quoteAmount.value.div(props.executionPrice)

  return props.isBuy ? minimumReceivedQuoteAmount : minimumReceivedBaseAmount
})

const { valueToString: minimumReceivedAmountToFormat } = useBigNumberFormatter(
  computed(() => minimumReceivedAmount.value || 0),
  {
    decimalPlaces: props.isBuy
      ? props.market.quantityDecimals
      : props.market.priceDecimals
  }
)
</script>

<template>
  <div :key="formValues[TradeField.TradingType]">
    <Suspense>
      <component
        :is="orderDetailsComponent"
        :execution-price="executionPrice"
        :form-values="formValues"
        :is-buy="isBuy"
        :liquidation-price="liquidationPrice"
        :market="market"
        :minimum-received-amount="minimumReceivedAmount"
        :notional-value="notionalValue"
        :order-type-reduce-only="orderTypeReduceOnly"
      >
        <template #total>{{ notionalWithFeesToFormat }}</template>
        <template #executionPrice>{{ executionPriceToFormat }}</template>
        <template #marketMinimumReceivedAmount>
          {{ minimumReceivedAmountToFormat }}
        </template>

        <template #makerTakerFeeRate>
          <PartialsTradingOrderDetailsMakerTakerFeeRate
            :market="market"
            :post-only="formValues[TradeField.PostOnly]"
            :trading-type="formValues[TradeField.TradingType]"
          />
        </template>

        <template #feeRate>
          <PartialsTradingOrderDetailsFeeRate
            :post-only="formValues[TradeField.PostOnly]"
            :fees="fees"
            :market="market"
            :notional-value="notionalValue"
            :trading-type="formValues[TradeField.TradingType]"
          />
        </template>

        <template #feeRebate>
          <PartialsTradingOrderDetailsFeeRebate
            :notional-value="notionalValue"
            :market="market"
          />
        </template>

        <template #expectedPts>
          <PartialsTradingOrderDetailsExpectedPoints
            :post-only="formValues[TradeField.PostOnly]"
            :fees="fees"
            :market="market"
            :trading-type="formValues[TradeField.TradingType]"
          />
        </template>
      </component>

      <template #fallback>
        <div class="w-full h-40">
          <AppLoading />
        </div>
      </template>
    </Suspense>
  </div>
</template>
