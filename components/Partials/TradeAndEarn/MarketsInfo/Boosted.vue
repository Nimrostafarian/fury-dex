<script lang="ts" setup>
import { cosmosSdkDecToBigNumber } from '@injectivelabs/sdk-ts'
import {
  perpetuals as sortPerpetualMarkets,
  spot as sortSpotMarkets
} from '@/nuxt-config/hooks/route'
import { PointsMultiplierWithMarketTicker } from '@/types'

const spotStore = useSpotStore()
const derivativeStore = useDerivativeStore()

const {
  boostInfo,
  derivativeBoostedMarketIdList,
  derivativeBoostedMultiplierList,
  disqualifiedMarketIdsList,
  spotBoostedMarketIdList,
  spotBoostedMultiplierList
} = useTradeReward()

const derivativeBoostedMarkets = computed(() => {
  if (!boostInfo.value) {
    return []
  }

  const derivativeMarketIds = derivativeBoostedMarketIdList.value
  const derivativeMarketsBoosts = derivativeBoostedMultiplierList.value
  const disqualifiedMarketIds = disqualifiedMarketIdsList.value

  const derivativeMarketsTickerBasedOnIds = derivativeStore.markets
    .filter((derivativeMarket) =>
      derivativeMarketIds.includes(derivativeMarket.marketId)
    )
    .filter((derivativeMarket) =>
      sortPerpetualMarkets.includes(derivativeMarket.slug)
    )
    .sort(
      (a, b) =>
        derivativeMarketIds.indexOf(a.marketId) -
        derivativeMarketIds.indexOf(b.marketId)
    )
    .map((m) => ({
      ticker: m.ticker,
      slug: m.slug,
      index: derivativeMarketIds.indexOf(m.marketId)
    }))

  const derivatives = derivativeMarketsTickerBasedOnIds.reduce(
    (records, market) => {
      return [
        ...records,
        {
          ...market,
          makerPointsMultiplier: cosmosSdkDecToBigNumber(
            derivativeMarketsBoosts[market.index].makerPointsMultiplier
          ).toFixed(),
          takerPointsMultiplier: cosmosSdkDecToBigNumber(
            derivativeMarketsBoosts[market.index].takerPointsMultiplier
          ).toFixed()
        } as PointsMultiplierWithMarketTicker
      ]
    },
    [] as PointsMultiplierWithMarketTicker[]
  )

  const nonBoostedDerivatives = [...derivativeStore.markets]
    .filter(
      (derivative) =>
        !derivativeMarketIds.includes(derivative.marketId) &&
        !disqualifiedMarketIds.includes(derivative.marketId)
    )
    .map((m) => ({ ticker: m.ticker, slug: m.slug }))
    .reduce((records, market) => {
      return [
        ...records,
        {
          ...market,
          makerPointsMultiplier: '1',
          takerPointsMultiplier: '1'
        }
      ]
    }, [] as PointsMultiplierWithMarketTicker[])

  return [...derivatives, ...nonBoostedDerivatives].sort((a, b) => {
    return (
      sortPerpetualMarkets.indexOf(a.slug) -
      sortPerpetualMarkets.indexOf(b.slug)
    )
  })
})

const spotBoostedMarkets = computed(() => {
  if (!boostInfo.value) {
    return []
  }

  const disqualifiedMarketIds = disqualifiedMarketIdsList.value
  const spotMarketIds = spotBoostedMarketIdList.value
  const spotMarketsBoosts = spotBoostedMultiplierList.value

  const spotMarketsTickerBasedOnIds = spotStore.markets
    .filter((spotMarket) => spotMarketIds.includes(spotMarket.marketId))
    .filter((spot) => sortSpotMarkets.includes(spot.slug))
    .sort(
      (a, b) =>
        spotMarketIds.indexOf(a.marketId) - spotMarketIds.indexOf(b.marketId)
    )
    .map((m) => ({
      ticker: m.ticker,
      slug: m.slug,
      index: spotMarketIds.indexOf(m.marketId)
    }))

  const spot = spotMarketsTickerBasedOnIds.reduce((records, market) => {
    return [
      ...records,
      {
        ...market,
        makerPointsMultiplier: cosmosSdkDecToBigNumber(
          spotMarketsBoosts[market.index].makerPointsMultiplier
        ).toFixed(),
        takerPointsMultiplier: cosmosSdkDecToBigNumber(
          spotMarketsBoosts[market.index].takerPointsMultiplier
        ).toFixed()
      } as PointsMultiplierWithMarketTicker
    ]
  }, [] as PointsMultiplierWithMarketTicker[])

  const nonBoostedSpot = [...spotStore.markets]
    .filter(
      (spotMarket) =>
        !spotMarketIds.includes(spotMarket.marketId) &&
        !disqualifiedMarketIds.includes(spotMarket.marketId)
    )
    .map((m) => ({ ticker: m.ticker, slug: m.slug }))
    .reduce((records, market) => {
      return [
        ...records,
        {
          ...market,
          makerPointsMultiplier: '1',
          takerPointsMultiplier: '1'
        }
      ]
    }, [] as PointsMultiplierWithMarketTicker[])

  return [...spot, ...nonBoostedSpot].sort((a, b) => {
    return sortSpotMarkets.indexOf(a.slug) - sortSpotMarkets.indexOf(b.slug)
  })
})
</script>

<template>
  <PartialsCommonStatsItem>
    <div class="flex justify-between text-xs w-full mx-auto">
      <div class="flex-1 px-4 lg:px-6">
        <p class="text-gray-200 text-center font-semibold">
          {{ $t('trade.derivatives') }}
        </p>
        <AppTextInfo
          v-for="derivative in derivativeBoostedMarkets"
          :key="`derivative-${derivative.ticker}`"
          :title="derivative.ticker"
          class="mt-1 text-gray-550"
          sm
        >
          <p class="text-white font-mono">
            <span>
              {{ derivative.makerPointsMultiplier }}x
              <span class="text-sm text-gray-350 font-sans">
                {{ $t('maker_points_mul') }}
              </span>
              /
              {{ derivative.takerPointsMultiplier }}x
              <span class="text-sm text-gray-350 font-sans">
                {{ $t('taker_points_mul') }}
              </span>
            </span>
          </p>
        </AppTextInfo>
      </div>

      <div class="flex-1 px-4 lg:px-12">
        <p class="text-gray-200 text-center font-semibold">
          {{ $t('trade.spot') }}
        </p>
        <AppTextInfo
          v-for="spot in spotBoostedMarkets"
          :key="`spot-${spot.ticker}`"
          :title="spot.ticker"
          class="mt-1 text-gray-550"
          sm
        >
          <p class="text-white font-mono">
            <span>
              {{ spot.makerPointsMultiplier }}x
              <span class="text-sm text-gray-350 font-sans">
                {{ $t('maker_points_mul') }}
              </span>
              /
              {{ spot.takerPointsMultiplier }}x
              <span class="text-sm text-gray-350 font-sans">
                {{ $t('taker_points_mul') }}
              </span>
            </span>
          </p>
        </AppTextInfo>
      </div>
    </div>

    <template #title>
      <div class="flex items-center justify-center text-gray-450 text-xs">
        {{ $t('trade.boosted_markets') }}
        <AppInfoTooltip
          class="ml-2 text-gray-450"
          :tooltip="$t('trade.boosted_markets_tooltip')"
        />
      </div>
    </template>
  </PartialsCommonStatsItem>
</template>
