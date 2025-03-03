<script lang="ts" setup>
import { PropType } from 'vue'
import { BigNumberInBase, Status, StatusType } from '@injectivelabs/utils'
import {
  UiDerivativeMarketSummary,
  UiDerivativeMarketWithToken,
  UiMarketHistory,
  ZERO_IN_BASE,
  UiSpotMarketSummary,
  UiSpotMarketWithToken
} from '@injectivelabs/sdk-ui-ts'
import {
  MARKETS_HISTORY_CHART_ONE_HOUR,
  MARKETS_HISTORY_CHART_SEVEN_DAYS,
  UI_DEFAULT_PRICE_DISPLAY_DECIMALS
} from '@/app/utils/constants'
import { Change, TradeClickOrigin } from '@/types'
import {
  getMarketRoute,
  getFormattedMarketsHistoryChartData
} from '@/app/utils/market'
import { amplitudeTracker } from '@/app/providers/AmplitudeTracker'

const exchangeStore = useExchangeStore()
const { $onError } = useNuxtApp()

const props = defineProps({
  isHero: Boolean,

  market: {
    required: true,
    type: Object as PropType<
      UiDerivativeMarketWithToken | UiSpotMarketWithToken
    >
  },

  summary: {
    required: true,
    type: Object as PropType<UiDerivativeMarketSummary | UiSpotMarketSummary>
  }
})

const status = reactive(new Status(StatusType.Loading))
const chartPadding = ref({ top: 4, right: 10, bottom: 4, left: 10 })
const useDefaultLastTradedPriceColor = ref(true)

const lastTradedPriceTextColorClass = computed(() => {
  if (useDefaultLastTradedPriceColor) {
    return 'text-gray-700'
  }

  return {
    'text-green-700': lastPriceChange.value !== Change.Decrease,
    'text-red-500': lastPriceChange.value === Change.Decrease
  }
})

const lastTradedPrice = computed(() => {
  if (!props.market || !props.summary) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(props.summary.price)
})

const { valueToString: lastTradedPriceToFormat } = useBigNumberFormatter(
  lastTradedPrice,
  {
    decimalPlaces:
      props.market?.priceDecimals || UI_DEFAULT_PRICE_DISPLAY_DECIMALS,
    displayAbsoluteDecimalPlace: true
  }
)

const change = computed(() => {
  if (!props.market || !props.summary || !props.summary.change) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(props.summary.change)
})

const { valueToString: changeToFormat } = useBigNumberFormatter(change, {
  decimalPlaces: 2,
  minimalDecimalPlaces: 4
})

const lastPriceChange = computed(() => {
  if (!props.market || !props.summary) {
    return Change.NoChange
  }

  if (!props.summary.lastPriceChange) {
    return Change.NoChange
  }

  return props.summary.lastPriceChange
})

const chartData = computed(() => {
  if (exchangeStore.marketsHistory.length === 0 || !props.market) {
    return []
  }

  const matchingMarket = exchangeStore.marketsHistory.find(
    (marketHistory: UiMarketHistory) => {
      return marketHistory.marketId === props.market.marketId
    }
  )

  if (!matchingMarket) {
    return []
  }

  return getFormattedMarketsHistoryChartData(matchingMarket)
})

const chartLineColor = computed(() => {
  const minimumChartDataPoints = 2

  if (chartData.value.length < minimumChartDataPoints) {
    return ''
  }

  const [firstChartDataPoint] = chartData.value
  const lastChartDataPointPosition = new BigNumberInBase(chartData.value.length)
    .minus(1)
    .toNumber()
  const [, firstYaxisHolcPrice] = firstChartDataPoint
  const [, lastYAxisHolcPrice] = chartData.value[lastChartDataPointPosition]
  const positiveChangeColor = '#12B17C'
  const negativeChangeColor = '#F3164D'

  return new BigNumberInBase(lastYAxisHolcPrice).gte(firstYaxisHolcPrice)
    ? positiveChangeColor
    : negativeChangeColor
})

const marketRoute = computed(() => {
  const marketRoute = getMarketRoute(props.market)

  return marketRoute || { name: 'markets' }
})

watch(
  () => lastPriceChange,
  (status) => {
    if (status.value === Change.NoChange) {
      return
    }

    updateLastPriceChangeColor()
  }
)

onMounted(() => {
  Promise.all([
    exchangeStore.getMarketsHistory({
      marketIds: [props.market.marketId],
      resolution: MARKETS_HISTORY_CHART_ONE_HOUR,
      countback: MARKETS_HISTORY_CHART_SEVEN_DAYS
    })
  ])
    .catch($onError)
    .finally(() => {
      status.setIdle()
    })
})

function updateLastPriceChangeColor() {
  useDefaultLastTradedPriceColor.value = false

  setTimeout(() => {
    useDefaultLastTradedPriceColor.value = true
  }, 3000)
}

function handleTradeClickedTrack() {
  amplitudeTracker.submitTradeClickedTrackEvent({
    market: props.market.slug,
    marketType: props.market.subType,
    origin: TradeClickOrigin.Lander
  })
}
</script>

<template>
  <div class="block" :class="{ 'min-w-3xl lg:min-w-[912px]': !isHero }">
    <div
      class="grid grid-cols-12 items-center py-4 box-content"
      :class="{ 'gap-4': isHero }"
      @click="handleTradeClickedTrack"
    >
      <div class="col-span-4 flex items-center justify-start pl-4">
        <div class="flex items-center justify-start gap-2">
          <NuxtLink :to="marketRoute">
            <div class="flex items-center justify-start">
              <CommonTokenIcon
                v-if="market.baseToken"
                :token="market.baseToken"
                class="md:w-6 md:h-6 mr-3"
                sm
              />

              <div class="text-left text-gray-700 text-sm whitespace-nowrap">
                <div class="flex leading-4 font-bold">
                  {{ market.ticker }}
                </div>
                <p class="text-gray-500 text-xs leading-3.5">
                  {{ market.baseToken.name }}
                </p>
              </div>
            </div>
          </NuxtLink>

          <PartialsCommonMarketAirdrop :market="market" />
        </div>
      </div>
      <div
        class="flex"
        :class="{ 'col-span-2': !isHero, 'col-span-3': isHero }"
      >
        <span
          class="w-full text-gray-900 font-medium text-sm font-mono text-right"
        >
          <div class="flex align-center justify-end">
            <BaseIcon
              v-if="!lastTradedPrice.isNaN() && !useDefaultLastTradedPriceColor"
              name="arrow"
              class="transform w-3 h-3 mr-1 mt-1"
              :class="{
                'text-green-700 rotate-90': lastPriceChange === Change.Increase,
                'text-red-500 -rotate-90': lastPriceChange === Change.Decrease
              }"
            />
            <span
              v-if="!lastTradedPrice.isNaN()"
              :class="lastTradedPriceTextColorClass"
            >
              {{ lastTradedPriceToFormat }}
            </span>
            <span v-else class="text-gray-400">&mdash;</span>
          </div>
        </span>
      </div>
      <div class="col-span-2 flex">
        <span
          v-if="!change.isNaN()"
          :class="[
            change.gte(0) ? 'text-green-700' : 'text-red-500',
            {
              'text-right': !isHero
            }
          ]"
          class="w-full font-mono text-sm"
        >
          {{ changeToFormat }}%
        </span>
        <span v-else class="text-gray-400">&mdash;</span>
      </div>
      <div
        class="flex h-7 w-[70%] relative"
        :class="{
          'col-span-2 justify-self-center lg:justify-self-end': !isHero,
          'col-span-3': isHero
        }"
      >
        <AppHocLoading
          :status="status"
          loader-class="w-6 h-6 text-center"
          no-padding
        >
          <BaseLineGraph
            v-if="chartData.length > 1"
            :data="chartData"
            :color="chartLineColor"
            :bg-type="'transparent'"
            :stroke-width="1"
            :smoothness="0.05"
            :padding="chartPadding"
          />
        </AppHocLoading>
      </div>
      <div v-if="!isHero" class="col-span-2 align-center justify-self-end">
        <NuxtLink :to="marketRoute">
          <AppButton class="border-blue-500 text-blue-500 w-full">
            {{ $t('common.trade') }}
          </AppButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
