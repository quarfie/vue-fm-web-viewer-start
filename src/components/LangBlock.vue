<script setup>
defineProps({
  language: {
    type: String,
    required: true,
  },
  bilingual: {
    type: Boolean,
    required: true,
  },
  customClass: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div
    :class="[
      customClass,
      'break-inside-avoid flex gap-x-4',
      language === 'fr' ? 'flex-row-reverse' : 'flex-row',
    ]"
  >
    <div v-if="language === 'en' || bilingual" class="flex-1">
      <slot name="en" />
    </div>
    <div v-if="language === 'fr' || bilingual" class="flex-1">
      <slot name="fr" />
    </div>
  </div>
</template>
