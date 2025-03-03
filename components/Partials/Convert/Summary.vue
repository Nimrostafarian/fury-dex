<script lang="ts" setup>
import { PropType } from 'vue'
import { UiSpotMarketWithToken, ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import { Token } from '@injectivelabs/token-metadata'
import { BigNumberInBase } from '@injectivelabs/utils'
import { ONE_IN_BASE } from '@/app/utils/constants'
import { TradeForm, TradeField } from '@/types'

const props = defineProps({
  isLoading: Boolean,
  isBuy: Boolean,

  amount: {
    type: String,
    default: undefined
  },

  worstPriceWithSlippage: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  formValues: {
    type: Object as PropType<TradeForm>,
    required: true
  },

  market: {
    type: Object as PropType<UiSpotMarketWithToken | undefined>,
    default: undefined
  }
})

const { takerFeeRate } = useTradeFee(computed(() => props.market))

const showEmpty = computed(() => {
  return (
    !props.market ||
    props.worstPriceWithSlippage.eq(0) ||
    new BigNumberInBase(props.amount || 0).isNaN()
  )
})

// execution_price * quantity * takerFeeRate * (1 - takerFeeRateDiscount)
const fee = computed<BigNumberInBase>(() => {
  const quantity = new BigNumberInBase(
    props.formValues[TradeField.QuoteAmount] || 0
  )

  if (quantity.isNaN() || quantity.lte(0)) {
    return ZERO_IN_BASE
  }

  return quantity.times(takerFeeRate.value)
})

const feeRateToFormat = computed(() => {
  return takerFeeRate.value.times(100).toFormat(2)
})

const priceForDisplay = computed(() => {
  if (props.isBuy) {
    // show quote to base averagePrice
    const quoteAmount = props.amount || 0

    return new BigNumberInBase(quoteAmount)
      .dividedBy(quoteAmount)
      .dividedBy(props.worstPriceWithSlippage)
  }

  return props.worstPriceWithSlippage
})

/*
  Buy:
  quote_quantity / (execution_price * (1 + slippage_tolerance) * (1 + feeRate))

  Sell:
  quantity * execution_price * (1 - slippage_tolerance) * (1 - feeRate)
*/

const minimalReceived = computed<BigNumberInBase>(() => {
  const quantity = new BigNumberInBase(props.amount || 0)
  const feeRate = new BigNumberInBase(takerFeeRate.value)

  if (props.isBuy) {
    return quantity.dividedBy(
      props.worstPriceWithSlippage.times(ONE_IN_BASE.plus(feeRate))
    )
  }

  return quantity.times(
    props.worstPriceWithSlippage.times(ONE_IN_BASE.minus(feeRate))
  )
})

const { valueToString: feeToFormat } = useBigNumberFormatter(fee, {
  decimalPlaces: props.market?.priceDecimals || 3,
  minimalDecimalPlaces: props.market?.priceDecimals || 3
})

const { valueToFixed: priceForDisplayToFormat } = useBigNumberFormatter(
  priceForDisplay,
  {
    decimalPlaces: props.market?.priceDecimals || 3,
    minimalDecimalPlaces: props.market?.priceDecimals || 3
  }
)

const { valueToString: minimalReceivedToFormat } = useBigNumberFormatter(
  minimalReceived,
  {
    decimalPlaces: props.market?.quantityDecimals || 3,
    minimalDecimalPlaces: props.market?.quantityDecimals || 3
  }
)

const inputToken = computed<Token | undefined>(() => {
  if (props.market) {
    return props.isBuy ? props.market.quoteToken : props.market.baseToken
  }
})

const outputToken = computed<Token | undefined>(() => {
  if (props.market) {
    return props.isBuy ? props.market.baseToken : props.market.quoteToken
  }
})
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex items-center justify-end gap-2">
      <span>{{ $t('trade.convert.fetching_price') }}</span>
      <AppSpinner sm />
    </div>

    <div v-else-if="inputToken && outputToken" class="space-y-3">
      <PartialsConvertSummaryRow :title="$t('trade.convert.rate')">
        <span v-if="showEmpty">&mdash;</span>
        <div v-else>
          <span> 1 {{ inputToken.symbol }} </span>
          =
          <span>
            {{ priceForDisplayToFormat }}
            {{ outputToken.symbol }}
          </span>
        </div>
      </PartialsConvertSummaryRow>

      <PartialsConvertSummaryRow
        :title="`${$t('trade.convert.fee')} (${feeRateToFormat}%)`"
      >
        <span v-if="showEmpty">&mdash;</span>
        <span v-else> {{ feeToFormat }} {{ market?.quoteToken.symbol }} </span>
      </PartialsConvertSummaryRow>

      <PartialsConvertSummaryRow :title="$t('trade.convert.minimum_received')">
        <span v-if="showEmpty">&mdash;</span>
        <span v-else>
          {{ minimalReceivedToFormat }} {{ outputToken.symbol }}
        </span>
      </PartialsConvertSummaryRow>
    </div>
  </div>
</template>
