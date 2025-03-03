<script lang="ts" setup>
import { PropType } from 'vue'
import { Status, StatusType } from '@injectivelabs/utils'
import {
  UiDerivativeLimitOrder,
  UiSpotLimitOrder
} from '@injectivelabs/sdk-ui-ts'
import { getMarketRoute } from '@/app/utils/market'

const derivativeStore = useDerivativeStore()
const spotStore = useSpotStore()
const { t } = useLang()
const route = useRoute()
const router = useRouter()
const { $onError } = useNuxtApp()
const { success } = useNotifications()

const props = defineProps({
  isSpot: Boolean,

  order: {
    required: true,
    type: Object as PropType<UiDerivativeLimitOrder | UiSpotLimitOrder>
  }
})

const isBinaryOptionsPage = route.name === 'binary-options-binaryOption'
const status = reactive(new Status(StatusType.Idle))

const {
  isBuy,
  price,
  total,
  market,
  quantity,
  leverage,
  priceDecimals,
  orderFillable,
  filledQuantity,
  quantityDecimals,
  unfilledQuantity,
  filledQuantityPercentageToFormat
} = useOrder(
  computed(() => props.order),
  computed(() => props.isSpot)
)

function onCancelOrder() {
  status.setLoading()

  if (props.isSpot) {
    return spotStore
      .cancelOrder(props.order as UiSpotLimitOrder)
      .then(() => {
        success({ title: t('trade.order_success_canceling') })
      })
      .catch($onError)
      .finally(() => {
        status.setIdle()
      })
  }

  derivativeStore
    .cancelOrder(props.order as UiDerivativeLimitOrder)
    .then(() => {
      success({ title: t('trade.order_success_canceling') })
    })
    .catch($onError)
    .finally(() => {
      status.setIdle()
    })
}

function handleClickOnMarket() {
  if (!market.value) {
    return
  }

  return router.push(getMarketRoute(market.value))
}
</script>

<template>
  <tr v-if="market" :data-cy="'order-table-row-' + market.ticker">
    <td class="h-12 text-left cursor-pointer pl-3" @click="handleClickOnMarket">
      <div class="flex items-center justify-start">
        <div v-if="market && !!market.baseToken.logo" class="w-4 h-4">
          <CommonTokenIcon :token="market.baseToken" sm />
        </div>
        <div class="ml-3">
          <span
            class="text-gray-200 text-xs"
            data-cy="order-ticker-name-table-data"
          >
            {{ market.ticker }}
          </span>
        </div>
      </div>
    </td>

    <td class="h-12 text-left">
      <span
        class="text-xs"
        data-cy="order-order-side-table-data"
        :class="{
          'text-green-500': isBuy,
          'text-red-500': !isBuy
        }"
      >
        {{ isBuy ? $t('trade.buy') : $t('trade.sell') }}
      </span>
    </td>

    <td class="h-12 font-mono text-right">
      <AppNumber
        xs
        data-cy="order-price-table-data"
        :decimals="priceDecimals"
        :number="price"
      />
    </td>
    <td class="h-12 text-right font-mono">
      <AppNumber
        xs
        data-cy="order-quantity-table-data"
        :decimals="quantityDecimals"
        :number="quantity"
      />
    </td>
    <td class="h-12 text-right font-mono">
      <AppNumber
        xs
        data-cy="order-unfilled-quantity-table-data"
        :decimals="quantityDecimals"
        :number="unfilledQuantity"
      />
    </td>
    <td class="h-12">
      <div class="flex items-center justify-end">
        <AppNumber
          xs
          data-cy="order-filled-quantity-table-data"
          :decimals="quantityDecimals"
          :number="filledQuantity"
        />
        <span v-if="filledQuantity.gt('0') && isSpot" class="ml-1 text-xs">
          ({{ filledQuantityPercentageToFormat }}%)
        </span>
      </div>
    </td>

    <td v-if="!isBinaryOptionsPage" class="h-12 text-right font-mono">
      <span
        v-if="leverage.gt(0)"
        class="flex items-center justify-end text-xs"
        data-cy="derivative-order-leverage-table-data"
      >
        {{ leverage.toFormat(2) }}
        <span class="text-gray-300 text-xs">&times;</span>
      </span>
      <span
        v-else
        class="text-gray-400 text-xs"
        data-cy="derivative-order-no-leverage-table-data"
      >
        {{ $t('trade.not_available_n_a') }}
      </span>
    </td>

    <td class="h-12 font-mono text-right">
      <AppNumber
        xs
        data-cy="order-total-table-data"
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
    <td class="h-12 relative text-right pr-3">
      <div class="flex items-center justify-end">
        <span
          v-if="false"
          class="cursor-pointer text-blue-500 mr-6"
          @click="handleClickOnMarket"
        >
          {{ $t('common.view') }}
        </span>

        <PartialsTradingFormCancelButton
          v-if="orderFillable"
          :status="status"
          data-cy="order-cancel-link"
          @click="onCancelOrder"
        />
        <span v-else class="inline-block">&mdash;</span>
      </div>
    </td>
  </tr>
</template>
