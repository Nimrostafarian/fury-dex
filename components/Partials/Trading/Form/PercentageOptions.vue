<script lang="ts" setup>
import { PropType } from 'vue'
import { BigNumberInBase } from '@injectivelabs/utils'
import {
  ZERO_IN_BASE,
  UiPriceLevel,
  UiPosition
} from '@injectivelabs/sdk-ui-ts'
import {
  MaxAmountOnOrderbook,
  TradeField,
  TradeForm,
  TradeFormValue,
  UiMarketWithToken
} from '@/types'
import {
  ONE_IN_BASE,
  TRADE_FORM_QUANTITY_ROUNDING_MODE,
  TRADE_FORM_PRICE_ROUNDING_MODE
} from '@/app/utils/constants'

const props = defineProps({
  isBuy: Boolean,
  isSpot: Boolean,
  orderTypeReduceOnly: Boolean,

  baseAvailableBalance: {
    type: Object as PropType<BigNumberInBase> | undefined,
    default: undefined
  },

  feeRate: {
    type: Object as PropType<BigNumberInBase>,
    default: ZERO_IN_BASE
  },

  formValues: {
    type: Object as PropType<TradeForm>,
    default: ONE_IN_BASE
  },

  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  },

  maxAmountOnOrderbook: {
    type: Object as PropType<MaxAmountOnOrderbook>,
    required: true
  },

  maxReduceOnly: {
    type: Object as PropType<BigNumberInBase | undefined>,
    default: undefined
  },

  orderbookOrders: {
    type: Array as PropType<UiPriceLevel[]>,
    required: true
  },

  position: {
    type: Object as PropType<UiPosition> | undefined,
    default: undefined
  },

  quoteAvailableBalance: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'update:amount', { isBase }: { isBase: boolean }): void
  (e: 'update:formValue', { field, value }: TradeFormValue): void
}>()

const percentages = [25, 50, 75, 100]

const { value: percentage, setValue } = useNumberField({
  name: TradeField.ProportionalPercentage,
  initialValue: 0,
  rule: ''
})

const spotAvailableBalanceGreaterThanOrderbook = computed(() => {
  const { totalNotional, totalQuantity } = props.maxAmountOnOrderbook

  return props.isBuy
    ? props.quoteAvailableBalance.gt(totalNotional)
    : props.baseAvailableBalance?.gt(totalQuantity)
})

const derivativeAvailableBalanceGreaterThanOrderbook = computed(() => {
  const { totalNotional } = props.maxAmountOnOrderbook

  const percentageToNumber = new BigNumberInBase(percentage.value).div(100)

  return props.quoteAvailableBalance.times(percentageToNumber).gt(totalNotional)
})

const feeRate = computed(() =>
  props.feeRate.lt(0) ? ZERO_IN_BASE : props.feeRate
)

const balanceToUpdateSpotWithFees = computed(() => {
  const percentageFormatted = new BigNumberInBase(percentage.value).div(100)
  const availableBalance = props.isBuy
    ? props.quoteAvailableBalance
    : props.baseAvailableBalance

  const balanceToUpdateSpot = new BigNumberInBase(
    availableBalance || ZERO_IN_BASE
  ).times(percentageFormatted)

  return props.isBuy
    ? balanceToUpdateSpot.minus(balanceToUpdateSpot.times(feeRate.value))
    : balanceToUpdateSpot
})

const balanceToUpdateDerivativesWithFees = computed(() => {
  const percentageFormatted = new BigNumberInBase(percentage.value).div(100)

  const balanceToUpdateDerivative = new BigNumberInBase(
    props.quoteAvailableBalance || ZERO_IN_BASE
  )
    .times(percentageFormatted)
    .times(props.formValues[TradeField.Leverage])

  return balanceToUpdateDerivative.minus(
    balanceToUpdateDerivative.times(feeRate.value)
  )
})

watch(
  () => props.feeRate,
  () => {
    if (!percentage.value) {
      return
    }

    handlePercentageChange(percentage.value)
  }
)

function handleReduceOnly() {
  if (!props.maxReduceOnly) {
    return
  }

  emit('update:formValue', {
    field: TradeField.BaseAmount,
    value: props.maxReduceOnly.toFixed(
      props.market.quantityDecimals,
      TRADE_FORM_QUANTITY_ROUNDING_MODE
    )
  })

  emit('update:amount', { isBase: true })
}

function handleDerivativePercentageChange() {
  // compare percent click amount to the max allowable quantity
  const field = derivativeAvailableBalanceGreaterThanOrderbook.value
    ? TradeField.BaseAmount
    : TradeField.QuoteAmount
  const amount = derivativeAvailableBalanceGreaterThanOrderbook.value
    ? props.maxAmountOnOrderbook.totalQuantity
    : balanceToUpdateDerivativesWithFees.value
  const decimals = derivativeAvailableBalanceGreaterThanOrderbook.value
    ? props.market.quantityDecimals
    : props.market.priceDecimals
  const roundingMode = derivativeAvailableBalanceGreaterThanOrderbook.value
    ? TRADE_FORM_QUANTITY_ROUNDING_MODE
    : TRADE_FORM_PRICE_ROUNDING_MODE

  emit('update:formValue', {
    field,
    value: amount.toFixed(decimals, roundingMode)
  })

  emit('update:amount', {
    isBase: derivativeAvailableBalanceGreaterThanOrderbook.value
  })
}

function handleSpotPercentageChange() {
  // compare percent click amount to the max allowable quantity
  const field =
    spotAvailableBalanceGreaterThanOrderbook.value || !props.isBuy
      ? TradeField.BaseAmount
      : TradeField.QuoteAmount
  const amount = spotAvailableBalanceGreaterThanOrderbook.value
    ? props.maxAmountOnOrderbook.totalQuantity
    : balanceToUpdateSpotWithFees.value
  const decimals =
    spotAvailableBalanceGreaterThanOrderbook.value || !props.isBuy
      ? props.market.quantityDecimals
      : props.market.priceDecimals
  const roundingMode =
    derivativeAvailableBalanceGreaterThanOrderbook.value || !props.isBuy
      ? TRADE_FORM_QUANTITY_ROUNDING_MODE
      : TRADE_FORM_PRICE_ROUNDING_MODE

  emit('update:formValue', {
    field,
    value: amount.toFixed(decimals, roundingMode)
  })

  emit('update:amount', {
    isBase: derivativeAvailableBalanceGreaterThanOrderbook.value || !props.isBuy
  })
}

function handlePercentageChange(percentage: number) {
  setValue(percentage)

  if (props.orderTypeReduceOnly) {
    return handleReduceOnly()
  }

  if (!props.isSpot) {
    return handleDerivativePercentageChange()
  }

  return handleSpotPercentageChange()
}
</script>

<template>
  <div class="text-xs text-gray-400 flex items-center font-mono">
    <span
      v-for="(percent, index) in percentages"
      :key="index"
      :data-cy="`trading-page-percentage-selector-${percent}-span`"
      class="mr-1 cursor-pointer"
      @click.stop="handlePercentageChange(percent)"
    >
      {{ percent }}%
    </span>
  </div>
</template>
