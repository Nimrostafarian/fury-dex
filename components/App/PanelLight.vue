<script lang="ts" setup>
defineProps({
  dense: Boolean,

  title: {
    default: '',
    type: String
  },

  portalName: {
    default: '',
    type: String
  },

  cardWrapperClass: {
    default: '',
    type: String
  }
})
</script>

<template>
  <div class="flex flex-col">
    <div
      v-if="title || $slots['title'] || $slots['title-context']"
      class="flex justify-between items-center"
    >
      <h3 class="text-xl font-bold text-gray-200">
        <slot name="title">{{ title }}</slot>
        <slot name="subtitle"></slot>
      </h3>
      <slot name="title-context" />
    </div>
    <slot name="context" />
    <CommonCard
      class="relative flex-1"
      :lg="!dense"
      :class="[cardWrapperClass]"
      :bg-color="'bg-transparent'"
    >
      <div class="v-panel-content">
        <slot ref="content" />
      </div>
    </CommonCard>
  </div>
</template>
