<script lang="ts" setup>
import { PropType } from 'vue'
import { BigNumberInBase, Status, StatusType } from '@injectivelabs/utils'
import {
  MarketType,
  UiDerivativeMarketWithToken,
  UiSpotMarketWithToken,
  ZERO_IN_BASE
} from '@injectivelabs/sdk-ui-ts'
import { Change, UiMarketWithToken, UiMarketSummary } from '@/types'
import { metaTags } from '@/nuxt-config/meta'

const derivativeStore = useDerivativeStore()
const spotStore = useSpotStore()
const { t } = useLang()

const props = defineProps({
  lg: Boolean,
  isStatsBar: Boolean,

  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  },

  summary: {
    type: Object as PropType<UiMarketSummary>,
    required: true
  }
})

const isSpot = props.market.type === MarketType.Spot

const status = reactive(new Status(StatusType.Loading))

const {
  lastTradedPrice: spotLastTradedPrice,
  lastTradedPriceChange: spotLastTradedPriceChange
} = useSpotLastPriceFormatter(
  props.market as UiSpotMarketWithToken,
  computed(() => spotStore.trades || [])
)

const {
  lastTradedPrice: derivativeLastTradedPrice,
  lastTradedPriceChange: derivativeLastTradedPriceChange
} = useDerivativeLastPriceFormatter(
  props.market as UiDerivativeMarketWithToken,
  computed(() => derivativeStore.trades || [])
)

const lastTradedPrice = computed(() => {
  if (props.isStatsBar) {
    return isSpot ? spotLastTradedPrice.value : derivativeLastTradedPrice.value
  }

  return new BigNumberInBase(
    props.summary.lastPrice || props.summary.price || 0
  )
})

const lastTradedPriceChange = computed(() =>
  isSpot
    ? spotLastTradedPriceChange.value
    : derivativeLastTradedPriceChange.value
)

const { valueToString: lastTradedPriceToFormat } = useBigNumberFormatter(
  lastTradedPrice,
  {
    decimalPlaces: props.market.priceDecimals,
    displayAbsoluteDecimalPlace: true
  }
)

const { valueToFixed: changeToFormat, valueToBigNumber: change } =
  useBigNumberFormatter(
    computed(() => {
      if (!props.summary || !props.summary.change) {
        return ZERO_IN_BASE
      }

      return props.summary.change
    })
  )

watch(lastTradedPriceToFormat, (newPrice: string) => {
  const marketTypePrefix = [
    MarketType.Derivative,
    MarketType.Futures,
    MarketType.Perpetual
  ].includes(props.market.type)
    ? `| ${t('trade.futures')}`
    : ''

  if (props.isStatsBar) {
    document.title = `${newPrice} - ${props.market.ticker} ${marketTypePrefix} | ${metaTags.title}`
  }
})

onBeforeUnmount(() => (document.title = metaTags.title))

useTimeoutFn(() => status.setIdle(), 3 * 1000)
</script>

<template>
  <div>
    <div
      v-if="
        status.isLoading() &&
        (lastTradedPrice.isNaN() || lastTradedPrice.lte(0))
      "
    >
      <AppSpinner xs />
    </div>
    <div v-else class="flex flex-col items-end font-mono">
      <div
        class="flex items-center tracking-wide leading-none"
        :class="{ 'text-xs': !lg }"
      >
        <BaseIcon
          v-if="
            [Change.Increase, Change.Decrease].includes(lastTradedPriceChange)
          "
          name="arrow"
          class="transform w-3 h-3 mr-1"
          :class="{
            'text-green-500 rotate-90':
              lastTradedPriceChange === Change.Increase,
            'text-red-500 -rotate-90': lastTradedPriceChange === Change.Decrease
          }"
        />
        <span
          data-cy="markets-last-traded-price-table-data"
          :class="{
            'text-green-500': lastTradedPriceChange === Change.Increase,
            'text-white': lastTradedPriceChange === Change.NoChange,
            'text-red-500': lastTradedPriceChange === Change.Decrease
          }"
        >
          {{ lastTradedPriceToFormat }}
        </span>
      </div>

      <div v-if="!change.isNaN()" class="mt-1 text-xs">
        <span
          :class="{
            'text-green-500': change.gt(0),
            'text-white': change.eq(0),
            'text-red-500': change.lt(0)
          }"
          data-cy="markets-change_24h-table-data"
        >
          {{ changeToFormat }}%
        </span>
      </div>
    </div>
  </div>
</template>
