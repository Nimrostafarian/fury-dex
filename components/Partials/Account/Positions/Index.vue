<script lang="ts" setup>
import { BankBalanceWithTokenAndBalanceInBase } from '@injectivelabs/sdk-ui-ts'
import { GeneralException } from '@injectivelabs/exceptions'

defineProps({
  hideBalances: {
    type: Boolean,
    required: true
  }
})

const positionStore = usePositionStore()
const derivativeStore = useDerivativeStore()
const { $onError } = useNuxtApp()
const { success } = useNotifications()
const { t } = useLang()

const { value: side } = useField<string>('side', {})
const { value: marketDenom } = useField<string>('marketDenom', {})

const positions = computed(() => {
  return positionStore.subaccountPositions
})

const markets = computed(() => {
  return derivativeStore.markets
})

const marketId = computed(() => {
  if (!marketDenom.value) {
    return undefined
  }

  return markets.value.find((m) => {
    return (
      m.baseToken.denom === marketDenom.value ||
      m.quoteToken.denom === marketDenom.value
    )
  })?.marketId
})

const filteredPositions = computed(() => {
  return positions.value.filter((position) => {
    if (!side.value && !marketId.value) {
      return true
    }

    if (!side.value && marketId.value) {
      return position.marketId === marketId.value
    }

    if (side.value && !marketId.value) {
      return position.direction === side.value
    }

    return (
      position.marketId === marketId.value && position.direction === side.value
    )
  })
})

const supportedTokens = computed(() => {
  const tokens = markets.value.reduce((list, market) => {
    const baseToken = {
      balance: '',
      denom: market.baseToken.denom,
      token: market.baseToken
    } as BankBalanceWithTokenAndBalanceInBase

    const quoteToken = {
      balance: '',
      denom: market.quoteToken.denom,
      token: market.quoteToken
    } as BankBalanceWithTokenAndBalanceInBase

    return [...list, baseToken, quoteToken]
  }, [] as BankBalanceWithTokenAndBalanceInBase[])

  const uniqueTokens = [
    ...new Map(tokens.map((token) => [token.denom, token])).values()
  ]

  return uniqueTokens
})

const sideOptions = computed(() => {
  return [
    {
      display: t('account.positions.side.short'),
      value: 'short'
    },
    {
      display: t('account.positions.side.long'),
      value: 'long'
    }
  ]
})

const marketOptions = computed(() => {
  return supportedTokens.value.map(({ token }) => {
    return {
      display: token.symbol,
      value: token.denom
    }
  })
})

const showEmpty = computed(() => {
  if (filteredPositions.value.length === 0) {
    return true
  }

  const hasUnavailableMarkets = filteredPositions.value.every(
    (position) =>
      markets.value.findIndex((m) => m.marketId === position.marketId) === -1
  )

  return hasUnavailableMarkets
})

function handleMarketDenomChange(value: string) {
  marketDenom.value = value
}

function handleSideChange(value: string) {
  side.value = value
}

function handleCloseAllPositions() {
  return positions.value.length === 1 ? closePosition() : closeAllPositions()
}

function closeAllPositions() {
  return positionStore
    .closeAllPosition(positions.value)
    .then(() => {
      success({
        title: t('trade.positions_closed')
      })
    })
    .catch($onError)
}

function closePosition() {
  const [position] = positions.value

  const market = markets.value.find((m) => m.marketId === position.marketId)

  if (!market) {
    throw new GeneralException(
      Error(
        t('trade.position_market_not_found', {
          marketId: position.marketId
        })
      )
    )
  }

  return positionStore
    .closePosition({
      position,
      market
    })
    .then(() => {
      success({
        title: t('trade.positions_closed')
      })
    })
    .catch($onError)
}
</script>

<template>
  <div>
    <PartialsAccountPositionsActions
      v-model:market-denom="marketDenom"
      v-model:side="side"
      :market-options="marketOptions"
      :side-options="sideOptions"
      @update:market-denom="handleMarketDenomChange"
      @update:side="handleSideChange"
      @close-all-positions="handleCloseAllPositions"
    />

    <table class="w-full border-collapse hidden lg:table">
      <PartialsAccountPositionsTableHeader />

      <PartialsAccountPositionsTableRow
        v-for="(position, i) in filteredPositions"
        :key="i"
        :position="position"
        :hide-balances="hideBalances"
      />
    </table>

    <table class="w-full border-collapse table lg:hidden">
      <PartialsAccountPositionsTableRowMobile
        v-for="(position, i) in filteredPositions"
        :key="i"
        class=""
        :position="position"
        :hide-balances="hideBalances"
      />
    </table>

    <CommonEmptyList
      v-if="showEmpty"
      class="min-h-3xs bg-gray-900"
      data-cy="markets-no-data-table"
      :message="$t('account.positions.empty')"
    >
      <span class="mt-2 text-xs text-gray-500">
        {{ $t('account.positions.empty') }}
      </span>
    </CommonEmptyList>
  </div>
</template>
