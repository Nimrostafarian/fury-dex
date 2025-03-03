<script lang="ts" setup>
import { PropType } from 'vue'

const props = defineProps({
  limit: {
    type: Number,
    required: true
  },

  options: {
    type: Array as PropType<number[]>,
    default: () => []
  },

  selectedClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', state: number): void
}>()

const selectedOption = computed(() => {
  return props.options.find((option) => option === props.limit)
})

function handleUpdateLimit(limit: any) {
  emit('update:modelValue', limit)
}
</script>

<template>
  <BaseDropdown class="inline-block" placement="top-end">
    <template #default="{ shown }">
      <div
        class="flex items-center gap-2 rounded"
        :classes="selectedClass || 'border border-gray-400 py-2 px-3'"
      >
        <span v-if="selectedOption" class="font-semibold text-white text-sm">
          {{ selectedOption }}
        </span>

        <div>
          <BaseIcon
            name="chevron-down"
            class="h-4 w-4 min-w-4 rotate-180"
            :class="[
              {
                'ease-in-out duration-300 rotate-0': shown
              }
            ]"
          />
        </div>
      </div>
    </template>

    <template #content="{ close }">
      <div class="p-2 bg-gray-850 shadow-sm">
        <BaseSelectorItem
          v-for="item in options"
          :key="`selector-row-item-${item}`"
          :value="item.toString()"
          :model-value="limit"
          @update:modelValue="handleUpdateLimit"
          @click="close"
        >
          <template #default="{ active }">
            <div
              class="group flex cursor-pointer items-center justify-between rounded hover:bg-blue-500 p-2 gap-2 text-sm"
            >
              <span
                class="font-semibold group-hover:text-black text-sm"
                :class="{ 'text-white': !active, 'text-blue-500': active }"
              >
                {{ item }}
              </span>
            </div>
          </template>
        </BaseSelectorItem>
      </div>
    </template>
  </BaseDropdown>
</template>
