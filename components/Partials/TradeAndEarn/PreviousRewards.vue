<script lang="ts" setup>
import {
  BigNumberInBase,
  BigNumberInWei,
  Status,
  StatusType
} from '@injectivelabs/utils'
import { ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import { format } from 'date-fns'
import { cosmosSdkDecToBigNumber } from '@injectivelabs/sdk-ts'
import {
  UI_DEFAULT_MIN_DISPLAY_DECIMALS,
  DEFAULT_CAPPED_TRADE_AND_EARN_REWARDS
} from '@/app/utils/constants'

const tokenStore = useTokenStore()
const walletStore = useWalletStore()
const exchangeStore = useExchangeStore()
const { poolCampaignScheduleList, rewardsCampaign } = useTradeReward()
const { $onError } = useNuxtApp()

const status = reactive(new Status(StatusType.Loading))

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

const pendingTradeRewardsPoints = computed(() => {
  return exchangeStore.pendingTradeRewardsPoints
})

const injUsdPrice = computed(() => {
  return tokenStore.injUsdPrice
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
  if (!poolCampaignScheduleList.value) {
    return 0
  }

  const [schedule] = poolCampaignScheduleList.value

  if (!schedule) {
    return 0
  }

  return new BigNumberInBase(schedule.startTimestamp).toNumber()
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
  if (!poolCampaignScheduleList.value) {
    return ZERO_IN_BASE
  }

  const schedules = poolCampaignScheduleList.value

  if (schedules.length === 0) {
    return ZERO_IN_BASE
  }

  return schedules.reduce((total, schedule) => {
    const [inj] = schedule.maxCampaignRewardsList

    if (!inj) {
      return total
    }

    return total.plus(
      new BigNumberInBase(cosmosSdkDecToBigNumber(inj.amount || 0))
    )
  }, ZERO_IN_BASE)
})

const injMaxPendingCampaignRewardsInUsd = computed(() => {
  return injMaxPendingCampaignRewards.value.multipliedBy(
    new BigNumberInBase(injUsdPrice.value)
  )
})

const pendingTradeRewardPoints = computed(() => {
  if (!pendingTradeRewardsPoints.value.length) {
    return ZERO_IN_BASE
  }

  if (pendingTradeRewardsPoints.value.length === 0) {
    return ZERO_IN_BASE
  }

  return pendingTradeRewardsPoints.value.reduce((total, points) => {
    if (!points) {
      return total
    }

    return total.plus(new BigNumberInBase(cosmosSdkDecToBigNumber(points)))
  }, ZERO_IN_BASE)
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

  return pointsList.reduce((total, pendingTotalTradeRewardPoints) => {
    if (!pendingTotalTradeRewardPoints) {
      return total
    }

    return total.plus(
      new BigNumberInBase(
        cosmosSdkDecToBigNumber(pendingTotalTradeRewardPoints)
      )
    )
  }, ZERO_IN_BASE)
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
    new BigNumberInBase(injUsdPrice.value)
  )
})

const hubUrl = 'https://hub.injective.network/staking'

onMounted(() => {
  Promise.all([exchangeStore.fetchPendingTradeRewardPoints()])
    .catch($onError)
    .finally(() => {
      status.setIdle()
    })
})
</script>

<template>
  <AppPanel :title="$t('tradeAndEarn.pendingRewards')">
    <template v-if="pendingRewardsStartTimestamp > 0" #context>
      <span class="text-gray-200">
        {{ $t('tradeAndEarn.campaignAsOf', { date: pendingRewardsCountdown }) }}
      </span>
    </template>
    <AppHocLoading :status="status">
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
                :tooltip="
                  $t('tradeAndEarn.pending_max_campaign_rewards_tooltip')
                "
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
                class="ml-2"
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
    </AppHocLoading>
  </AppPanel>
</template>
