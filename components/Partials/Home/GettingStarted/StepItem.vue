<script lang="ts" setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },

  value: {
    type: String,
    required: true
  },

  step: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <BaseSelectorItem
    :model-value="modelValue"
    :value="value"
    v-bind="$attrs"
    class="flex-grow"
  >
    <template #default="{ active }">
      <div
        class="flex items-center gap-4 cursor-pointer shadow-helixLight h-[80px]"
        :class="{
          'opacity-50': !active
        }"
      >
        <div
          class="w-8 h-8 ml-6 rounded-full flex items-center justify-center"
          :class="[active ? 'bg-blue-100' : 'bg-gray-600 opacity-50']"
        >
          <span class="font-semibold text-white">{{ step }}</span>
        </div>
        <!-- <BaseIcon
          name="circle"
          class="ml-6"
          :class="[!active ? 'text-blue-100' : 'text-gray-450']"
        /> -->
        <slot />
      </div>
    </template>
  </BaseSelectorItem>
</template>
