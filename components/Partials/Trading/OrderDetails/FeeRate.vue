<script lang="ts" setup>
import { PropType } from 'vue'
import { ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { UiMarketWithToken, TradeExecutionType } from '@/types'

const props = defineProps({
  postOnly: Boolean,

  fees: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  },

  notionalValue: {
    type: Object as PropType<BigNumberInBase>,
    default: ZERO_IN_BASE
  },

  tradingType: {
    type: String as PropType<TradeExecutionType>,
    default: ''
  }
})

const {
  makerFeeRate,
  makerFeeRateDiscount,
  takerFeeRate,
  takerFeeRateDiscount
} = useTradeFee(computed(() => props.market))

const marketHasNegativeMakerFee = computed(() =>
  new BigNumberInBase(props.market.makerFeeRate).lt(0)
)

const tradeTypeMarket = computed(() =>
  [TradeExecutionType.Market, TradeExecutionType.StopMarket].includes(
    props.tradingType
  )
)

const feeReturned = computed(() => {
  if (!props.notionalValue) {
    return ZERO_IN_BASE
  }

  if (props.notionalValue.isNaN() || props.notionalValue.lte(0)) {
    return ZERO_IN_BASE
  }

  return props.notionalValue.times(
    new BigNumberInBase(takerFeeRate.value).minus(makerFeeRate.value.abs())
  )
})

const { valueToString: feesToFormat } = useBigNumberFormatter(
  computed(() => props.fees),
  {
    decimalPlaces: props.market.priceDecimals
  }
)

const { valueToString: feeReturnedToFormat } = useBigNumberFormatter(
  feeReturned,
  {
    decimalPlaces: props.market.priceDecimals
  }
)
</script>

<template>
  <AppTextInfo
    v-if="!(postOnly && marketHasNegativeMakerFee) || tradeTypeMarket"
    :title="$t('trade.fee')"
    class="mt-2"
  >
    <template v-if="!tradeTypeMarket" #context>
      <div class="flex items-center gap-2 ml-2">
        <AppInfoTooltip
          class="ml-2"
          :tooltip="
            marketHasNegativeMakerFee
              ? $t('trade.fee_order_details_note_negative_margin')
              : $t('trade.fee_order_details_note', {
                  feeReturnedToFormat
                })
          "
        />

        <AppInfoTooltip
          v-if="makerFeeRateDiscount.gt(0) || takerFeeRateDiscount.gt(0)"
          class="text-blue-500"
          :tooltip="
            $t('trade.fees_tooltip_discount', {
              maker: makerFeeRateDiscount.times(100).toFixed(),
              taker: takerFeeRateDiscount.times(100).toFixed()
            })
          "
        >
          <BaseIcon name="check-circle" class="text-blue-500 w-3 h-3 min-w-3" />
        </AppInfoTooltip>
      </div>
    </template>

    <template v-else #context>
      <div class="flex items-center gap-2 ml-2">
        <AppInfoTooltip :tooltip="$t('trade.fees_tooltip')" />

        <AppInfoTooltip
          v-if="takerFeeRateDiscount.gt(0)"
          class="text-blue-500"
          :tooltip="
            $t('trade.taker_fees_tooltip_discount', {
              taker: takerFeeRateDiscount.times(100).toFixed()
            })
          "
        >
          <BaseIcon name="check-circle" class="text-blue-500 w-3 h-3 min-w-3" />
        </AppInfoTooltip>
      </div>
    </template>

    <span
      v-if="fees.gt(0)"
      class="font-mono flex items-start break-all"
      data-cy="trading-page-details-fee-value-text-content"
    >
      <span class="mr-1">≈</span>
      {{ feesToFormat }}
      <span class="text-gray-500 ml-1 break-normal">
        {{ market.quoteToken.symbol }}
      </span>
    </span>
    <span v-else class="text-gray-500 ml-1"> &mdash; </span>
  </AppTextInfo>
</template>
