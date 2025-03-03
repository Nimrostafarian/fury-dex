<script lang="ts" setup>
import { Modal } from '@/types'

const modalStore = useModalStore()

function handleConfirm() {
  closeModal()

  modalStore.openModal({ type: Modal.Connect })
}

function handleCancel() {
  closeModal()
}

function closeModal() {
  modalStore.closeModal(Modal.Terms)
}
</script>

<template>
  <AppModalWrapper
    :show="modalStore.modals[Modal.Terms]"
    @modal:closed="closeModal"
  >
    <template #title>
      <h3>
        {{ $t('Acknowledge Terms') }}
      </h3>
    </template>

    <div class="relative">
      <i18n-t keypath="terms.disclaimer_note" tag="p" class="text-sm">
        <template #terms>
          <NuxtLink
            target="_blank"
            class="text-blue-500 hover:text-opacity-80"
            to="https://injectivelabs.org/terms-and-conditions"
          >
            {{ $t('terms.termsAndCondition') }}
          </NuxtLink>
        </template>

        <template #policy>
          <NuxtLink
            target="_blank"
            class="text-blue-500 hover:text-opacity-80"
            to="https://injectivelabs.org/privacy-policy"
          >
            {{ $t('terms.privacyPolicy') }}
          </NuxtLink>
        </template>

        <template #disclaimer>
          <NuxtLink
            target="_blank"
            class="text-blue-500 hover:text-opacity-80"
            to="https://injectiveprotocol.com/disclaimer"
          >
            {{ $t('terms.disclaimer') }}
          </NuxtLink>
        </template>
      </i18n-t>

      <ul class="p-4 bg-gray-900 mt-6 text-xs text-gray-300 rounded-lg">
        <li class="font-bold text-gray-200">
          {{ $t('terms.title') }}
        </li>
        <li class="mt-2">
          {{ $t('terms.acknowledge_1') }}
        </li>
        <li class="mt-2">
          {{ $t('terms.acknowledge_2') }}
        </li>
        <li class="mt-2">
          {{ $t('terms.acknowledge_3') }}
        </li>
        <li class="mt-2">
          {{ $t('terms.acknowledge_4') }}
        </li>
        <li class="mt-2">
          {{ $t('terms.acknowledge_5') }}
        </li>
      </ul>
      <div class="mt-6 flex items-center justify-center gap-3">
        <AppButton
          class="bg-blue-500 text-blue-900 font-semibold"
          @click="handleConfirm"
        >
          {{ $t('common.confirm') }}
        </AppButton>
        <AppButton
          class="text-red-500 bg-red-500 bg-opacity-10 font-semibold hover:text-white"
          @click="handleCancel"
        >
          {{ $t('common.cancel') }}
        </AppButton>
      </div>
    </div>
  </AppModalWrapper>
</template>
