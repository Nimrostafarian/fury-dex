<script lang="ts" setup>
import { PropType } from 'vue'
import { TradeDirection } from '@injectivelabs/ts-types'
import { UiDerivativeTrade, UiSpotTrade } from '@injectivelabs/sdk-ui-ts'
import { getMarketRoute } from '@/app/utils/market'

const props = defineProps({
  isSpot: Boolean,

  trade: {
    required: true,
    type: Object as PropType<UiSpotTrade | UiDerivativeTrade>
  }
})

const {
  fee,
  time,
  price,
  total,
  market,
  quantity,
  priceDecimals,
  quantityDecimals,
  tradeExecutionType
} = useTrade(
  computed(() => props.trade),
  computed(() => props.isSpot)
)

const marketRoute = computed(() => {
  if (!market.value) {
    return { name: 'markets' }
  }

  const marketRoute = getMarketRoute(market.value)

  return marketRoute || { name: 'markets' }
})
</script>

<template>
  <tr v-if="market" :data-cy="'trade-history-table-row-' + market.ticker">
    <td class="h-12 text-left pl-3">
      <span class="text-white text-xs" data-cy="trade-entry-time">
        {{ time }}
      </span>
    </td>
    <td class="h-12 text-left cursor-pointer">
      <NuxtLink class="flex items-center justify-start" :to="marketRoute">
        <div v-if="market.baseToken" class="w-4 h-4">
          <CommonTokenIcon :token="market.baseToken" />
        </div>
        <div class="ml-3">
          <span
            class="text-gray-200 text-xs"
            data-cy="trade-history-ticker-name-table-data"
          >
            {{ market.ticker }}
          </span>
        </div>
      </NuxtLink>
    </td>

    <td
      class="h-12 text-left"
      data-cy="trade-history-execution-type-table-data"
    >
      <span class="text-white text-xs">
        {{ tradeExecutionType }}
      </span>
    </td>

    <td class="h-12 text-left">
      <span
        data-cy="trade-history-trade-directon-table-data"
        class="text-xs"
        :class="{
          'text-green-500': trade.tradeDirection === TradeDirection.Buy,
          'text-red-500': trade.tradeDirection === TradeDirection.Sell
        }"
      >
        {{
          $t(
            `trade.${
              trade.tradeDirection === TradeDirection.Buy ? 'buy' : 'sell'
            }`
          )
        }}
      </span>
    </td>

    <td class="h-12 text-right font-mono">
      <AppNumber
        xs
        data-cy="trade-history-price-table-data"
        :decimals="priceDecimals"
        :number="price"
      />
    </td>

    <td class="h-12 text-right font-mono">
      <AppNumber
        xs
        data-cy="trade-history-quantity-table-data"
        :decimals="quantityDecimals"
        :number="quantity"
      />
    </td>
    <td class="h-12 text-right font-mono">
      <AppNumber
        xs
        use-number-decimals
        :number="fee"
        data-cy="trade-history-fee-table-data"
      >
        <template #addon>
          <span class="text-xs text-gray-500">
            {{ market.quoteToken.symbol }}
          </span>
        </template>
      </AppNumber>
    </td>

    <td class="h-12 text-right font-mono pr-3">
      <AppNumber
        xs
        data-cy="trade-history-total-table-data"
        :decimals="priceDecimals"
        :number="total"
      >
        <template #addon>
          <span class="text-xs text-gray-500">
            {{ market.quoteToken.symbol }}
          </span>
        </template>
      </AppNumber>
    </td>
  </tr>
</template>
