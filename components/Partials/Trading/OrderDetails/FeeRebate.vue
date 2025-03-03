<script lang="ts" setup>
import { PropType } from 'vue'
import { ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { UiMarketWithToken } from '@/types'

const props = defineProps({
  notionalValue: {
    type: Object as PropType<BigNumberInBase>,
    default: ZERO_IN_BASE
  },

  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  }
})

const { makerFeeRate } = useTradeFee(computed(() => props.market))

const marketHasNegativeMakerFee = computed(() =>
  new BigNumberInBase(props.market.makerFeeRate).lt(0)
)

const feeRebates = computed(() => {
  if (!props.notionalValue) {
    return ZERO_IN_BASE
  }

  if (props.notionalValue.isNaN()) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(
    props.notionalValue.times(makerFeeRate.value).abs()
  ).times(0.6 /* Only 60% of the fees are getting returned */)
})

const { valueToString: feeRebatesToFormat } = useBigNumberFormatter(
  feeRebates,
  {
    decimalPlaces: props.market.priceDecimals
  }
)
</script>

<template>
  <AppTextInfo
    v-if="marketHasNegativeMakerFee"
    :title="$t('trade.est_fee_rebate')"
    class="mt-2"
  >
    <template #context>
      <AppInfoTooltip class="ml-2" :tooltip="$t('trade.est_fee_rebate_note')" />
    </template>
    <span
      v-if="feeRebates.gt(0)"
      data-cy="trading-page-details-fee-rebate-value-text-content"
      class="font-mono flex items-start break-all"
    >
      {{ feeRebatesToFormat }}
      <span class="text-gray-500 ml-1 break-normal">
        {{ market.quoteToken.symbol }}
      </span>
    </span>
    <span v-else class="text-gray-500 ml-1"> &mdash; </span>
  </AppTextInfo>
</template>
