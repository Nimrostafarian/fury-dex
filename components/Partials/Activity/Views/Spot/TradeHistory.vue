<script lang="ts" setup>
import { PropType } from 'vue'
import { Status } from '@injectivelabs/utils'
import { UiDerivativeTrade, UiSpotTrade } from '@injectivelabs/sdk-ui-ts'
import { Modal } from '@/types'

defineProps({
  status: {
    type: Object as PropType<Status>,
    default: () => new Status()
  }
})

const spotStore = useSpotStore()
const modalStore = useModalStore()

const tradeDetails = ref(undefined as UiSpotTrade | undefined)

const trades = computed(() => {
  return spotStore.subaccountTrades
})

function handleShowTradeDetails(value: UiSpotTrade | UiDerivativeTrade) {
  tradeDetails.value = value as UiSpotTrade

  modalStore.openModal({ type: Modal.MobileTradeDetails })
}
</script>

<template>
  <AppHocLoading
    :status="status"
    :loader-class="status.isLoading() ? 'relative' : ''"
  >
    <div class="w-full h-full-flex">
      <!-- mobile table -->
      <CommonTableBody
        :show-empty="trades.length === 0"
        class="sm:hidden mt-3 max-h-lg overflow-y-auto"
      >
        <PartialsCommonSubaccountTradeHistoryMobile
          v-for="(trade, index) in trades"
          :key="`mobile-spot-trade-${index}`"
          class="col-span-1"
          :trade="trade"
          is-spot
          @show-trade-details="handleShowTradeDetails"
        />

        <template #empty>
          <CommonEmptyList
            :message="$t('trade.emptyTrades')"
            class="pb-4 grow bg-gray-900"
          />
        </template>
      </CommonTableBody>

      <CommonTableWrapper break-md class="hidden sm:block">
        <table v-if="trades.length > 0" class="table">
          <PartialsCommonSubaccountTradeHistoryHeader />
          <tbody>
            <PartialsCommonSubaccountTradeHistoryRow
              v-for="(trade, index) in trades"
              :key="`trade-${index}`"
              :trade="trade"
              is-spot
            />
          </tbody>
        </table>

        <CommonEmptyList
          v-else
          :message="$t('trade.emptyTrades')"
          data-cy="universal-table-nothing-found"
          class="pb-4 grow"
        />
      </CommonTableWrapper>

      <ModalsMobileTradeDetails is-spot :trade="tradeDetails" />
    </div>
  </AppHocLoading>
</template>
