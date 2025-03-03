<script lang="ts" setup>
import { PropType } from 'vue'
import { MarketType } from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { UiMarketAndSummaryWithVolumeInUsd } from '@/types'
import { marketIsPartOfType, marketIsPartOfSearch } from '@/app/utils/market'

enum SortableKeys {
  Market = 'market',
  Change = 'change',
  Volume = 'volume'
}

const appStore = useAppStore()

const props = defineProps({
  markets: {
    type: Array as PropType<UiMarketAndSummaryWithVolumeInUsd[]>,
    required: true
  }
})

const activeType = ref('')
const search = ref('')
const ascending = ref(false)
const sortBy = ref(SortableKeys.Volume)

const filteredMarkets = computed(() => {
  return props.markets.filter(({ market }) => {
    const isPartOfSearch = marketIsPartOfSearch(search.value, market)
    const isPartOfType = marketIsPartOfType({
      market,
      favoriteMarkets: appStore.favoriteMarkets,
      activeType: activeType.value as MarketType
    })

    return isPartOfType && isPartOfSearch
  })
})

const sortedMarkets = computed(() => {
  if (sortBy.value.trim() === '') {
    return filteredMarkets.value
  }

  const list = [...filteredMarkets.value].sort(
    (
      m1: UiMarketAndSummaryWithVolumeInUsd,
      m2: UiMarketAndSummaryWithVolumeInUsd
    ) => {
      if (sortBy.value === SortableKeys.Market) {
        return m2.market.ticker.localeCompare(m1.market.ticker)
      }

      if (sortBy.value === SortableKeys.Change) {
        if (new BigNumberInBase(m2.summary.change).eq(m1.summary.change)) {
          return m1.market.ticker.localeCompare(m2.market.ticker)
        }

        return new BigNumberInBase(m2.summary.change)
          .minus(m1.summary.change)
          .toNumber()
      }

      if (new BigNumberInBase(m2.volumeInUsd).eq(m1.volumeInUsd)) {
        return m1.market.ticker.localeCompare(m2.market.ticker)
      }

      // default: sort by volume
      return m2.volumeInUsd.minus(m1.volumeInUsd).toNumber()
    }
  )

  return ascending.value ? list.reverse() : list
})
</script>

<template>
  <div>
    <PartialsTradingSidebarMarketsFilter
      v-model:active-type="activeType"
      v-model:search="search"
      class="mb-2"
    />

    <CommonTableHeader classes="grid grid-cols-2 md:grid">
      <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1">
        <AppSortableHeaderItem
          v-model:sort-by="sortBy"
          v-model:ascending="ascending"
          :value="SortableKeys.Market"
        >
          <span
            class="text-gray-200 text-xs font-normal order-last whitespace-nowrap"
          >
            {{ $t('trade.market') }} /
          </span>
        </AppSortableHeaderItem>

        <AppSortableHeaderItem
          v-model:sort-by="sortBy"
          v-model:ascending="ascending"
          data-cy="markets-volume_24h-table-header"
          :value="SortableKeys.Volume"
        >
          <span class="text-gray-200 text-xs font-normal order-last">
            {{ $t('trade.volume') }}
          </span>
        </AppSortableHeaderItem>
      </div>

      <div
        class="flex flex-col xl:flex-row items-end xl:items-center gap-1 text-gray-200 text-xs justify-self-end"
      >
        <span class="font-normal"> {{ $t('trade.price') }} / </span>

        <AppSortableHeaderItem
          v-model:sort-by="sortBy"
          v-model:ascending="ascending"
          class="justify-end"
          data-cy="markets-change_24h-table-header"
          :value="SortableKeys.Change"
        >
          <span class="font-normal order-last">
            {{ $t('trade.market_change') }}
          </span>
        </AppSortableHeaderItem>
      </div>
    </CommonTableHeader>

    <CommonTableBody
      :show-empty="sortedMarkets.length === 0"
      class="rounded overflow-hidden"
    >
      <PartialsTradingSidebarMarketsTableRow
        v-for="({ market, summary, volumeInUsd }, index) in sortedMarkets"
        :key="`market-row-${index}-${market.marketId}`"
        :class="{
          'pt-4': index === 0,
          'pb-4': index + 1 === sortedMarkets.length
        }"
        :market="market"
        :summary="summary"
        :volume-in-usd="volumeInUsd"
        v-bind="$attrs"
      />

      <template #empty>
        <CommonEmptyList
          class="min-h-3xs bg-gray-900"
          data-cy="markets-no-data-table"
          :message="
            activeType === MarketType.Favorite
              ? $t('markets.emptyHeaderFavorites')
              : $t('markets.emptyHeader')
          "
        >
          <template #icon>
            <BaseIcon name="star-border" class="text-gray-500 w-8 h-8" />
          </template>

          <span
            v-if="activeType === MarketType.Favorite"
            class="mt-1 text-2xs text-gray-500 text-center"
          >
            {{ $t('markets.emptyDescriptionFavorites') }}
          </span>

          <span v-else class="mt-1 text-2xs text-gray-500 text-center">
            {{ $t('markets.emptyDescription') }}
          </span>
        </CommonEmptyList>
      </template>
    </CommonTableBody>
  </div>
</template>
