<script lang="ts" setup>
import { BigNumberInBase, BigNumberInWei } from '@injectivelabs/utils'
import { format } from 'date-fns'
import { PropType } from 'vue'
import { ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import {
  CampaignRewardPool,
  cosmosSdkDecToBigNumber
} from '@injectivelabs/sdk-ts'
import {
  UI_DEFAULT_MIN_DISPLAY_DECIMALS,
  DEFAULT_CAPPED_TRADE_AND_EARN_REWARDS
} from '@/app/utils/constants'

const walletStore = useWalletStore()
const tokenStore = useTokenStore()
const exchangeStore = useExchangeStore()
const { rewardsCampaign } = useTradeReward()

const props = defineProps({
  schedule: {
    type: Object as PropType<CampaignRewardPool>,
    required: true
  },

  index: {
    type: Number,
    required: true
  }
})

const stakedAmount = computed(() => {
  if (!exchangeStore.feeDiscountAccountInfo) {
    return ZERO_IN_BASE
  }

  if (!exchangeStore.feeDiscountAccountInfo.accountInfo) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(
    cosmosSdkDecToBigNumber(
      exchangeStore.feeDiscountAccountInfo.accountInfo.stakedAmount
    )
  )
})

const vestingDurationInSeconds = computed(() => {
  if (!exchangeStore.params) {
    return 0
  }

  if (!exchangeStore.params.tradingRewardsVestingDuration) {
    return 0
  }

  return new BigNumberInBase(
    exchangeStore.params.tradingRewardsVestingDuration || 0
  ).toNumber()
})

const currentEpochStartTimestamp = computed(() => {
  if (!props.schedule) {
    return 0
  }

  return new BigNumberInBase(props.schedule.startTimestamp).toNumber()
})

const pendingRewardsStartTimestamp = computed(() => {
  if (currentEpochStartTimestamp.value === 0) {
    return 0
  }

  return new BigNumberInBase(currentEpochStartTimestamp.value)
    .minus(vestingDurationInSeconds.value)
    .toNumber()
})

const pendingRewardsCountdown = computed(() => {
  return format(
    (pendingRewardsStartTimestamp.value + vestingDurationInSeconds.value) *
      1000,
    'dd MMM HH:mm:ss'
  )
})

const injMaxPendingCampaignRewards = computed(() => {
  if (!props.schedule) {
    return ZERO_IN_BASE
  }

  const [inj] = props.schedule.maxCampaignRewardsList

  return new BigNumberInBase(cosmosSdkDecToBigNumber(inj.amount || 0))
})

const injMaxPendingCampaignRewardsInUsd = computed(() => {
  return injMaxPendingCampaignRewards.value.multipliedBy(
    new BigNumberInBase(tokenStore.injUsdPrice)
  )
})

const pendingTradeRewardPoints = computed(() => {
  if (exchangeStore.pendingTradeRewardsPoints.length === 0) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(
    cosmosSdkDecToBigNumber(
      exchangeStore.pendingTradeRewardsPoints[props.index] || 0
    )
  )
})

const pendingTradeRewardPointsFactored = computed(() => {
  return new BigNumberInWei(pendingTradeRewardPoints.value).toBase(
    6 /* Default factor for points, USDT decimals */
  )
})

const totalPendingTradeRewardPoints = computed(() => {
  if (!rewardsCampaign.value) {
    return ZERO_IN_BASE
  }

  const pointsList = rewardsCampaign.value.pendingTotalTradeRewardPointsList

  if (pointsList.length === 0) {
    return ZERO_IN_BASE
  }

  return new BigNumberInBase(
    cosmosSdkDecToBigNumber(pointsList[props.index] || 0)
  )
})

const totalPendingTradeRewardPointsFactored = computed(() => {
  return new BigNumberInWei(totalPendingTradeRewardPoints.value).toBase(
    6 /* Default factor for points, USDT decimals */
  )
})

const pendingEstimatedRewards = computed(() => {
  if (totalPendingTradeRewardPoints.value.lte(0)) {
    return ZERO_IN_BASE
  }

  if (pendingTradeRewardPoints.value.lte(0)) {
    return ZERO_IN_BASE
  }

  return pendingTradeRewardPoints.value
    .dividedBy(totalPendingTradeRewardPoints.value)
    .times(injMaxPendingCampaignRewards.value)
})

const pendingEstimatedRewardsCapped = computed(() => {
  if (
    pendingEstimatedRewards.value.lte(DEFAULT_CAPPED_TRADE_AND_EARN_REWARDS)
  ) {
    return pendingEstimatedRewards.value
  }

  if (stakedAmount.value.lte(DEFAULT_CAPPED_TRADE_AND_EARN_REWARDS)) {
    return new BigNumberInBase(DEFAULT_CAPPED_TRADE_AND_EARN_REWARDS)
  }

  return pendingEstimatedRewards.value.gte(stakedAmount.value)
    ? stakedAmount.value
    : pendingEstimatedRewards.value
})

const pendingEstimatedRewardsCappedInUsd = computed(() => {
  return pendingEstimatedRewardsCapped.value.multipliedBy(
    new BigNumberInBase(tokenStore.injUsdPrice)
  )
})

const hubUrl = 'https://hub.injective.network/staking'
</script>

<template>
  <AppPanel>
    <div
      v-if="pendingRewardsStartTimestamp > 0"
      class="text-right text-sm mb-4"
    >
      {{ $t('tradeAndEarn.campaignAsOf', { date: pendingRewardsCountdown }) }}
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
      <PartialsCommonStatsItem class="col-span-2 lg:col-span-4">
        <template #value>
          <AppEmpNumber
            :number="injMaxPendingCampaignRewards"
            :decimals="UI_DEFAULT_MIN_DISPLAY_DECIMALS"
          >
            <span>INJ</span>
          </AppEmpNumber>

          <AppEmpNumber
            sm
            class="text-gray-450"
            prefix="≈"
            :number="injMaxPendingCampaignRewardsInUsd"
            :decimals="UI_DEFAULT_MIN_DISPLAY_DECIMALS"
          >
            <span>USD</span>
          </AppEmpNumber>
        </template>
        <template #title>
          <div class="flex items-center justify-center text-gray-450 text-xs">
            {{ $t('tradeAndEarn.pending_max_campaign_rewards') }}
            <AppInfoTooltip
              class="ml-2 text-gray-450"
              :tooltip="$t('tradeAndEarn.pending_max_campaign_rewards_tooltip')"
            />
          </div>
        </template>
      </PartialsCommonStatsItem>
      <PartialsCommonStatsItem class="col-span-2 lg:col-span-4">
        <template #value>
          <div
            v-if="walletStore.isUserWalletConnected"
            class="flex flex-wrap justify-center"
          >
            <AppEmpNumber :number="pendingTradeRewardPointsFactored">
              <span>{{ $t('pts') }}</span>
            </AppEmpNumber>
            <span class="px-2 text-xl self-center">/</span>
            <AppEmpNumber :number="totalPendingTradeRewardPointsFactored">
              <span>{{ $t('pts') }}</span>
            </AppEmpNumber>
          </div>
          <span v-else class="text-gray-450">&mdash;</span>
        </template>
        <template #title>
          <div
            class="flex items-center justify-center text-xs text-gray-450 3xl:whitespace-nowrap -ml-2"
          >
            {{ $t('tradeAndEarn.myRewardPoints') }}
            <AppInfoTooltip
              class="ml-2 text-gray-450"
              :tooltip="$t('tradeAndEarn.myRewardPoints_tooltip')"
            />
          </div>
        </template>
      </PartialsCommonStatsItem>
      <PartialsCommonStatsItem class="col-span-2 lg:col-span-4">
        <template #value>
          <AppEmpNumber
            v-if="walletStore.isUserWalletConnected"
            :number="pendingEstimatedRewardsCapped"
            :decimals="UI_DEFAULT_MIN_DISPLAY_DECIMALS"
          >
            <span>INJ</span>
          </AppEmpNumber>
          <span v-else>&mdash;</span>
          <AppEmpNumber
            v-if="walletStore.isUserWalletConnected"
            sm
            class="text-gray-450"
            prefix="≈"
            :number="pendingEstimatedRewardsCappedInUsd"
            :decimals="UI_DEFAULT_MIN_DISPLAY_DECIMALS"
          >
            <span class="text-sm">USD</span>
          </AppEmpNumber>
        </template>
        <template
          v-if="
            pendingEstimatedRewards.gt(0) &&
            pendingEstimatedRewardsCapped.lte(pendingEstimatedRewards)
          "
          #context
        >
          <a
            v-if="walletStore.isUserWalletConnected"
            :href="hubUrl"
            class="text-blue-500 flex justify-center"
            target="_blank"
          >
            {{ $t('stake_more') }}
            <AppInfoTooltip
              class="ml-2 text-gray-450"
              :tooltip="
                $t('tradeAndEarn.stake_total_to_receive_full_amount', {
                  total: pendingEstimatedRewards.toFormat(2)
                })
              "
            />
          </a>
        </template>
        <template #title>
          <div class="flex items-center justify-center text-gray-450">
            {{ $t('tradeAndEarn.est_rewards_stake') }}
            <AppInfoTooltip
              class="ml-2 text-gray-450"
              :tooltip="
                $t('tradeAndEarn.est_rewards_stake_tooltip', {
                  maxRewards: DEFAULT_CAPPED_TRADE_AND_EARN_REWARDS
                })
              "
            />
          </div>
        </template>
      </PartialsCommonStatsItem>
    </div>
  </AppPanel>
</template>
