<script lang="ts" setup>
import { PropType } from 'vue'
import {
  getTokenLogoWithVendorPathPrefix,
  UiSpotMarketWithToken
} from '@injectivelabs/sdk-ui-ts'
import { Token } from '@injectivelabs/token-metadata'
import { BigNumberInBase } from '@injectivelabs/utils'
import {
  HIDDEN_BALANCE_DISPLAY,
  UI_DEFAULT_DISPLAY_DECIMALS
} from '@/app/utils/constants'
import { AccountBalance, BridgeBusEvents } from '@/types'

const props = defineProps({
  balance: {
    type: Object as PropType<AccountBalance>,
    required: true
  },

  hideBalances: {
    type: Boolean,
    required: true
  }
})

const router = useRouter()
const spotStore = useSpotStore()

const isOpen = ref(false)

const markets = computed(() => {
  return spotStore.markets
})

const filteredMarkets = computed(() => {
  return markets.value.filter(
    (m) =>
      m.baseDenom === props.balance.token.denom ||
      m.quoteDenom === props.balance.token.denom
  )
})

const tokenLogo = computed(() => {
  return getTokenLogoWithVendorPathPrefix(props.balance.token.logo)
})

const combinedBalance = computed(() => {
  return new BigNumberInBase(props.balance.bankBalance || 0).plus(
    props.balance.subaccountTotalBalance || 0
  )
})

const totalBalance = computed(() => {
  return new BigNumberInBase(props.balance.bankBalance || 0).plus(
    props.balance.subaccountAvailableBalance || 0
  )
})

const { valueToString: totalBalanceInUsdToString } = useBigNumberFormatter(
  computed(() => totalBalance.value.times(props.balance.token.usdPrice || 0)),
  {
    decimalPlaces: UI_DEFAULT_DISPLAY_DECIMALS
  }
)

const { valueToString: availableBalanceToString } = useBigNumberFormatter(
  computed(() => props.balance.subaccountAvailableBalance),
  {
    decimalPlaces: UI_DEFAULT_DISPLAY_DECIMALS
  }
)

const { valueToString: combinedBalanceToString } = useBigNumberFormatter(
  combinedBalance,
  {
    decimalPlaces: UI_DEFAULT_DISPLAY_DECIMALS
  }
)

const { valueToString: inOrderBalanceToString } = useBigNumberFormatter(
  computed(() => props.balance.inOrderBalance),
  {
    decimalPlaces: UI_DEFAULT_DISPLAY_DECIMALS
  }
)

function handleNavigateToMarket(market: UiSpotMarketWithToken) {
  router.push({
    name: 'spot-spot',
    params: {
      spot: market.slug
    }
  })
}

function handleDepositClick() {
  useEventBus<Token | undefined>(BridgeBusEvents.Deposit).emit(
    props.balance.token
  )
}

function handleWithdrawClick() {
  useEventBus<Token | undefined>(BridgeBusEvents.Withdraw).emit(
    props.balance.token
  )
}
</script>

<template>
  <tr
    class="border-b border-gray-700 last-of-type:border-b-transparent hover:bg-gray-700 bg-transparent px-4 py-0 overflow-hidden h-14 gap-2 transition-all"
    :class="{ 'max-h-20': !isOpen, 'max-h-screen': isOpen }"
    :data-cy="'wallet-balance-table-row-' + balance.token.symbol"
  >
    <td class="pl-4">
      <div class="flex justify-start items-center gap-2">
        <div class="w-6 h-6 rounded-full self-center">
          <img :src="tokenLogo" :alt="balance.token.name" />
        </div>

        <div class="flex justify-start gap-2 items-center">
          <span
            class="text-white font-bold tracking-wide text-sm uppercase h-auto flex items-center"
            data-cy="wallet-balance-token-symbol-table-data"
          >
            {{ balance.token.symbol }}
          </span>
          <span class="text-gray-500 text-xs">
            {{ balance.token.name }}
          </span>
        </div>
      </div>
    </td>

    <td>
      <div class="flex justify-end" data-cy="wallet-balance-total-table-data">
        <span v-if="hideBalances" class="font-mono text-sm text-right">
          {{ HIDDEN_BALANCE_DISPLAY }}
        </span>

        <span
          v-else-if="combinedBalance.gt(0)"
          class="font-mono text-sm text-right"
        >
          {{ combinedBalanceToString }}
        </span>

        <span v-else> &mdash; </span>
      </div>
    </td>

    <td>
      <div class="flex justify-end">
        <span v-if="hideBalances" class="font-mono text-sm text-right">
          {{ HIDDEN_BALANCE_DISPLAY }}
        </span>

        <span v-else class="font-mono text-sm text-right">
          {{ availableBalanceToString }}
        </span>
      </div>
    </td>

    <td>
      <div class="flex justify-end">
        <span v-if="hideBalances" class="font-mono text-sm text-right">
          {{ HIDDEN_BALANCE_DISPLAY }}
        </span>

        <span v-else class="font-mono text-sm text-right">
          {{ inOrderBalanceToString }}
        </span>
      </div>
    </td>

    <td>
      <div class="flex justify-end">
        <span v-if="hideBalances" class="font-mono text-sm text-right">
          {{ HIDDEN_BALANCE_DISPLAY }} USD
        </span>

        <span v-else class="font-mono text-sm text-right">
          {{ totalBalanceInUsdToString }} USD
        </span>
      </div>
    </td>

    <td class="pr-4">
      <div class="flex items-center justify-end gap-4 col-start-2 col-span-2">
        <BaseDropdown
          v-if="filteredMarkets.length > 1"
          popper-class="rounded-lg flex flex-col flex-wrap text-xs absolute w-36 bg-gray-750 shadow-dropdown"
        >
          <template #default>
            <div
              class="rounded flex items-center justify-center w-auto h-auto cursor-pointer"
            >
              <span class="text-blue-500 text-sm font-medium cursor-pointer">
                {{ $t('account.trade') }}
              </span>
            </div>
          </template>

          <template #content>
            <div class="flex flex-col py-2">
              <span
                v-for="market in filteredMarkets"
                :key="market.slug"
                class="px-4 py-2 font-semibold text-sm uppercase cursor-pointer text-white hover:text-blue-500"
                @click="handleNavigateToMarket(market)"
              >
                {{ market.baseToken.symbol }}/{{ market.quoteToken.symbol }}
              </span>
            </div>
          </template>
        </BaseDropdown>

        <div
          v-if="filteredMarkets.length === 1"
          class="rounded flex items-center justify-center w-auto h-auto cursor-pointer"
          @click="handleNavigateToMarket(filteredMarkets[0])"
        >
          <span class="text-blue-500 text-sm font-medium cursor-pointer">
            {{ $t('account.trade') }}
          </span>
        </div>

        <div
          class="rounded flex items-center justify-center w-auto h-auto cursor-pointer"
          data-cy="wallet-balance-deposit-link"
          @click="handleDepositClick"
        >
          <span class="text-blue-500 text-sm font-medium">
            {{ $t('account.deposit') }}
          </span>
        </div>

        <div
          class="rounded flex items-center justify-center w-auto h-auto cursor-pointer"
          data-cy="wallet-balance-withdraw-link"
          @click="handleWithdrawClick"
        >
          <span class="text-blue-500 text-sm font-medium">
            {{ $t('account.withdraw') }}
          </span>
        </div>
      </div>
    </td>
  </tr>
</template>
