<script lang="ts" setup>
import { PropType } from 'vue'
import { Status } from '@injectivelabs/utils'
import { UiDerivativeOrderHistory } from '@injectivelabs/sdk-ui-ts'
import { getMarketRoute } from '@/app/utils/market'

const derivativeStore = useDerivativeStore()
const router = useRouter()
const { success } = useNotifications()
const { $onError } = useNuxtApp()
const { t } = useLang()

const props = defineProps({
  trigger: {
    required: true,
    type: Object as PropType<UiDerivativeOrderHistory>
  }
})

const status = reactive(new Status())
const {
  isBuy,
  total,
  price,
  market,
  quantity,
  leverage,
  isReduceOnly,
  filledQuantity,
  isCancelable,
  isMarketOrder,
  priceDecimals,
  quantityDecimals
} = useTrigger(computed(() => props.trigger))

function onCancelOrder(): void {
  status.setLoading()

  derivativeStore
    .cancelOrder(props.trigger)
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
  <CommonTableRow v-if="market" dense>
    <div class="pb-1 col-span-2" @click="handleClickOnMarket">
      <div class="flex items-center justify-between text-xs leading-5">
        <div class="flex items-center gap-1">
          <span
            :class="{
              'text-green-500': isBuy,
              'text-red-500': !isBuy
            }"
          >
            {{ isBuy ? $t('trade.buy') : $t('trade.sell') }}
          </span>
          <div v-if="market.baseToken" class="w-4 h-4">
            <CommonTokenIcon :token="market.baseToken" sm />
          </div>
          <span class="text-gray-200 font-semibold">
            {{ market.ticker }}
          </span>

          <span v-if="leverage.gte(0)" class="font-mono">
            {{ leverage.toFormat(2) }}x
          </span>
        </div>

        <PartialsTradingFormCancelButton
          v-if="isCancelable"
          :status="status"
          sm
          @click="onCancelOrder"
        />
      </div>
      <div
        v-if="isReduceOnly"
        class="mt-0.5 text-gray-500 uppercase tracking-widest text-2xs"
      >
        {{ $t('trade.reduce_only') }}
      </div>
    </div>

    <span class="text-gray-500 uppercase tracking-widest text-3xs">
      {{ $t('trade.price') }}
    </span>
    <div class="text-right">
      <span v-if="isMarketOrder" class="text-white text-xs">
        {{ $t('trade.market') }}
      </span>

      <AppNumber v-else :decimals="priceDecimals" :number="price" />
    </div>

    <span class="text-gray-500 uppercase tracking-widest text-3xs">
      {{ $t('trade.filled') }} / {{ $t('trade.amount') }}
    </span>
    <div class="flex items-center gap-1 justify-end">
      <AppNumber :decimals="quantityDecimals" :number="filledQuantity" />
      <span>/</span>
      <AppNumber :decimals="quantityDecimals" :number="quantity" />
    </div>

    <span class="text-gray-500 uppercase tracking-widest text-3xs">
      {{ $t('trade.total') }}
    </span>
    <div class="text-right">
      <AppNumber :decimals="priceDecimals" :number="total">
        <template #addon>
          <span class="text-2xs text-gray-500">
            {{ market.quoteToken.symbol }}
          </span>
        </template>
      </AppNumber>
    </div>
  </CommonTableRow>
</template>
