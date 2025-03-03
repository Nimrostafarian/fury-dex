<script lang="ts" setup>
import { BigNumberInBase } from '@injectivelabs/utils'
import { ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import { cosmosSdkDecToBigNumber } from '@injectivelabs/sdk-ts'
import { UI_DEFAULT_MIN_DISPLAY_DECIMALS } from '@/app/utils/constants'

const paramStore = useParamStore()
const exchangeStore = useExchangeStore()

const feeDiscountAccountInfo = computed(() => {
  return exchangeStore.feeDiscountAccountInfo
})

const apr = computed(() => {
  return paramStore.apr.times(100)
})

const { valueToString: aprToFormat } = useBigNumberFormatter(apr, {
  decimalPlaces: 2
})

const stakedAmount = computed(() => {
  if (
    !feeDiscountAccountInfo.value ||
    !feeDiscountAccountInfo.value.accountInfo
  ) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(
    cosmosSdkDecToBigNumber(
      feeDiscountAccountInfo.value.accountInfo.stakedAmount
    )
  )
})

const { valueToString: stakedAmountToFormat } = useBigNumberFormatter(
  stakedAmount,
  {
    decimalPlaces: UI_DEFAULT_MIN_DISPLAY_DECIMALS
  }
)
</script>

<template>
  <div class="flex flex-col bg-gray-850 rounded-lg p-6 h-full">
    <div class="flex justify-start gap-6 lg:gap-8">
      <div class="flex flex-col">
        <span
          class="text-gray-500 uppercase tracking-wide text-xs mb-2 font-semibold whitespace-nowrap"
        >
          {{ $t('fee_discounts.my_staked_amount') }}
        </span>
        <span
          class="uppercase text-xs lg:text-base text-gray-500 font-bold tracking-widest whitespace-nowrap"
        >
          <b
            class="text-xl lg:text-2xl font-bold text-white tracking-normal font-mono"
          >
            {{ stakedAmountToFormat }}
          </b>
          INJ
        </span>
      </div>
    </div>
    <div class="mt-4">
      <span class="text-xs text-gray-400">
        {{ $t('fee_discounts.current_apr') }}: {{ aprToFormat }}%
      </span>
    </div>
  </div>
</template>
