<script lang="ts" setup>
const route = useRoute()

const isBinaryOptionsPage = route.name === 'binary-options-binaryOption'
</script>

<template>
  <thead>
    <tr class="h-8">
      <th class="text-left pl-3">
        {{ $t('trade.market') }}
      </th>
      <th class="text-left">
        {{ $t('trade.type') }}
      </th>
      <th class="text-left">
        {{ $t('trade.side') }}
      </th>
      <th class="text-right">
        {{ $t('trade.price') }}
      </th>
      <th>
        <div class="flex items-center justify-end">
          <span>{{ $t('trade.amount') }}</span>
          <AppInfoTooltip class="ml-2" :tooltip="$t('trade.amount_tooltip')" />
        </div>
      </th>
      <th v-if="!isBinaryOptionsPage" class="text-right">
        {{ $t('trade.leverage') }}
      </th>
      <th class="text-right">
        {{ $t('trade.total') }}
      </th>
      <th class="text-right">
        {{ $t('trade.triggerCondition') }}
      </th>
      <th></th>
    </tr>
  </thead>
</template>
