<script lang="ts" setup>
import { PropType } from 'vue'
import { BigNumberInBase } from '@injectivelabs/utils'
import {
  UiPerpetualMarketWithToken,
  UiExpiryFuturesMarketWithToken
} from '@injectivelabs/sdk-ui-ts'
import { TradeField, TradeForm, UiMarketWithToken } from '@/types'

const derivativeStore = useDerivativeStore()

const props = defineProps({
  isBuy: Boolean,

  executionPrice: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  formValues: {
    type: Object as PropType<TradeForm>,
    required: true
  },

  leverageFieldName: {
    type: String as PropType<TradeField>,
    required: true
  },

  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  },

  worstPriceWithSlippage: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  }
})

const { tradingTypeMarket } = useSpotFormFormatter(
  computed(() => props.formValues)
)

const maxLeverageAvailable = computed(() => {
  const maxLeverage = new BigNumberInBase(
    new BigNumberInBase(1)
      .dividedBy(
        (
          props.market as
            | UiPerpetualMarketWithToken
            | UiExpiryFuturesMarketWithToken
        ).initialMarginRatio
      )
      .dp(0)
  )

  const steps = [1, 2, 5, 10, 20, 50, 100, 150, 200]

  const stepsLessThanMaxLeverage = steps.filter(
    (step) => step <= maxLeverage.toNumber()
  )

  return stepsLessThanMaxLeverage.length > 0
    ? new BigNumberInBase(
        stepsLessThanMaxLeverage[stepsLessThanMaxLeverage.length - 1]
      ).toFixed()
    : new BigNumberInBase(20).toFixed()
})

const maxLeverageAllowed = computed(() => {
  const useExecutionPrice = !tradingTypeMarket.value
  const price = useExecutionPrice
    ? props.executionPrice
    : props.worstPriceWithSlippage

  const priceWithMarginRatio = new BigNumberInBase(
    derivativeStore.marketMarkPrice
  ).times(
    (
      props.market as
        | UiPerpetualMarketWithToken
        | UiExpiryFuturesMarketWithToken
    ).initialMarginRatio
  )

  const priceBasedOnOrderType = props.isBuy
    ? priceWithMarginRatio.minus(derivativeStore.marketMarkPrice).plus(price)
    : priceWithMarginRatio.plus(derivativeStore.marketMarkPrice).minus(price)

  return price.dividedBy(priceBasedOnOrderType)
})

const {
  value: leverage,
  setValue,
  resetField
} = useStringField({
  name: props.leverageFieldName,
  initialValue: '1',
  rule: 'required',
  dynamicRule: computed(
    () => `maxLeverage:${maxLeverageAllowed.value.toFixed()},${props.isBuy}`
  )
})

function validateLeverage(value: string) {
  nextTick(() => {
    const leverageToBigNumber = new BigNumberInBase(value)

    if (leverageToBigNumber.gte(maxLeverageAvailable.value)) {
      setValue(maxLeverageAvailable.value)
    } else if (leverageToBigNumber.lt(1)) {
      resetField()
    }
  })
}
</script>

<template>
  <div class="pt-1">
    <div>
      <h3 class="text-xs text-gray-400">
        {{ $t('trade.max_leverage', { max: maxLeverageAvailable }) }}
      </h3>
    </div>

    <div class="range-wrap flex items-center relative select-none gap-2">
      <input
        v-model="leverage"
        min="1"
        :max="maxLeverageAvailable.toString()"
        step="0.01"
        class="range"
        type="range"
        @update:modelValue="validateLeverage"
      />
      <div class="relative max-h-6">
        <AppNumericInput
          v-model="leverage"
          min="0"
          step="0.01"
          :max="maxLeverageAvailable.toString()"
          class="leverage-input pr-4 h-1"
          data-cy="trading-page-leverage-input"
          @update:modelValue="validateLeverage"
        />
        <span
          class="absolute top-0 right-0 text-xs text-gray-400 mt-1.5 mr-1.5"
        >
          x
        </span>
      </div>
    </div>
  </div>
</template>

<style>
.input-base.leverage-input {
  @apply font-mono ml-2 w-16 py-1 h-auto text-sm text-right rounded-lg appearance-none text-gray-300;
}

/* Chrome, Safari, Edge, Opera */
.leverage-input::-webkit-outer-spin-button,
.leverage-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.leverage-input[type='number'] {
  -moz-appearance: textfield;
}
</style>
