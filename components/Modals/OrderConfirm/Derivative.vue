<script lang="ts" setup>
import { PropType } from 'vue'
import { DerivativeOrderSide } from '@injectivelabs/sdk-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import {
  UiDerivativeMarketWithToken,
  ZERO_IN_BASE
} from '@injectivelabs/sdk-ui-ts'
import { Modal, TradeExecutionType } from '@/types'

const props = defineProps({
  isReduceOnly: Boolean,

  amount: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  market: {
    type: Object as PropType<UiDerivativeMarketWithToken>,
    required: true
  },

  orderType: {
    type: String as PropType<DerivativeOrderSide>,
    default: ''
  },

  price: {
    type: Object as PropType<BigNumberInBase>,
    default: ZERO_IN_BASE
  },

  tradingType: {
    type: String as PropType<TradeExecutionType>,
    default: ''
  },

  triggerPrice: {
    type: Object as PropType<BigNumberInBase>,
    default: ZERO_IN_BASE
  }
})

const emit = defineEmits<{
  (e: 'confirmed'): void
}>()

const appStore = useAppStore()
const modalStore = useModalStore()
const { t } = useLang()

const showModal = computed(() => modalStore.modals[Modal.OrderConfirm])

const orderTypeBuy = computed(() => {
  return [DerivativeOrderSide.TakeBuy, DerivativeOrderSide.StopBuy].includes(
    props.orderType
  )
})

const orderTypeTakeProfit = computed(() => {
  return [DerivativeOrderSide.TakeBuy, DerivativeOrderSide.TakeSell].includes(
    props.orderType
  )
})

const orderTypeStopLoss = computed(() => {
  return [DerivativeOrderSide.StopBuy, DerivativeOrderSide.StopSell].includes(
    props.orderType
  )
})

const tradingTypeMarket = computed(() => {
  return ['stopMarket', 'market'].includes(props.tradingType.trim())
})

const markPriceIncrease = computed(() => {
  return (
    (orderTypeBuy.value && orderTypeStopLoss.value) ||
    (!orderTypeBuy.value && orderTypeTakeProfit.value)
  )
})

const { valueToString: amountToFormat } = useBigNumberFormatter(
  computed(() => props.amount),
  {
    decimalPlaces: props.market.quantityDecimals
  }
)

const { valueToString: priceToFormat } = useBigNumberFormatter(
  computed(() => props.price),
  { decimalPlaces: props.market.priceDecimals }
)

const { valueToString: triggerPriceToFormat } = useBigNumberFormatter(
  computed(() => props.triggerPrice),
  {
    decimalPlaces: props.market.priceDecimals
  }
)

function confirm() {
  emit('confirmed')
  close()
}

function close() {
  modalStore.closeModal(Modal.OrderConfirm)
}

function handleSkipTradeConfirmationModal() {
  appStore.setUserState({
    ...appStore.userState,
    skipTradeConfirmationModal: true
  })
}
</script>

<template>
  <AppModalWrapper
    :show="showModal"
    :sm="!!tradingType"
    data-cy="price-deviation-modal"
    @modal:closed="close"
  >
    <template #title>
      <h3 class="flex items-center justify-start gap-2">
        <span
          class="normal-case"
          :class="{
            'text-green-500': orderTypeBuy,
            'text-red-500': !orderTypeBuy
          }"
        >
          {{ $t(`${orderTypeBuy ? 'trade.buy' : 'trade.sell'}`) }}
        </span>

        <span v-if="orderTypeTakeProfit" class="normal-case font-semibold">
          {{ t('trade.takeProfit') }}
          {{ tradingTypeMarket ? t('trade.market') : t('trade.limit') }}
        </span>

        <span v-if="orderTypeStopLoss" class="normal-case font-semibold">
          {{ t('trade.stopLoss') }}
          {{ tradingTypeMarket ? t('trade.market') : t('trade.limit') }}
        </span>
      </h3>
    </template>

    <div class="flex flex-col gap-6">
      <i18n-t
        :keypath="
          tradingTypeMarket
            ? 'trade.confirmOrderModal.descriptionMarket'
            : 'trade.confirmOrderModal.descriptionLimit'
        "
        tag="p"
        class="text-sm"
      >
        <template #verb>
          <span v-if="markPriceIncrease">
            {{ t('trade.confirmOrderModal.rises') }}
          </span>

          <span v-else>
            {{ t('trade.confirmOrderModal.drops') }}
          </span>
        </template>

        <template #preposition>
          <span v-if="markPriceIncrease">
            {{ t('trade.confirmOrderModal.above') }}
          </span>

          <span v-else>
            {{ t('trade.confirmOrderModal.below') }}
          </span>
        </template>

        <template #triggerPrice>
          <b>{{ triggerPriceToFormat }}</b>
        </template>

        <template #triggerPriceSymbol>
          <b>{{ market.quoteToken.symbol }}</b>
        </template>

        <template v-if="isReduceOnly" #reduceOnly>
          {{ t('trade.reduce_only').toLowerCase() }}
        </template>

        <template #tradingType>
          <span v-if="tradingTypeMarket">
            {{ t('trade.market').toLowerCase() }}
          </span>

          <span v-else>
            {{ t('trade.limit').toLowerCase() }}
          </span>
        </template>

        <template #orderType>
          <span v-if="orderTypeBuy">
            {{ t('trade.buy').toLowerCase() }}
          </span>

          <span v-else>
            {{ t('trade.sell').toLowerCase() }}
          </span>
        </template>

        <template #amount>
          <b>{{ amountToFormat }}</b>
        </template>

        <template #amountSymbol>
          <b>{{ market.baseToken.symbol }}</b>
        </template>

        <template #price>
          <b>{{ priceToFormat }}</b>
        </template>

        <template #priceSymbol>
          <b>{{ market.quoteToken.symbol }}</b>
        </template>
      </i18n-t>

      <div class="flex justify-between items-center gap-6">
        <AppButton
          class="bg-blue-500 text-blue-900"
          data-cy="confirm-order-modal-confirm-button"
          @click="confirm"
        >
          {{ $t('common.confirm') }}
        </AppButton>

        <AppButton
          class="text-red-500 bg-red-500 bg-opacity-10 font-semibold hover:text-white"
          data-cy="confirm-order-modal-confirm-button"
          @click="close"
        >
          {{ $t('common.cancel') }}
        </AppButton>
      </div>

      <div>
        <AppCheckbox
          :model-value="false"
          data-cy="confirm-order-modal-do-not-show-toggle"
          @input="handleSkipTradeConfirmationModal"
        >
          <slot class="text-xs">
            {{ $t('trade.confirmOrderModal.doNotShowThisConfirmationAgain') }}
          </slot>
        </AppCheckbox>
      </div>
    </div>
  </AppModalWrapper>
</template>
