<script setup>
import { toRef } from 'vue'

import MarkdownField from '@/components/MarkdownField.vue'
import { useBilingualSlots } from '@/composables/useBilingualSlots'

const props = defineProps({
  labelen: {
    type: String,
    required: true,
  },
  labelfr: {
    type: String,
    required: true,
  },
  text: {
    type: Object,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  bilingual: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * When true, fields stack vertically instead of sitting side-by-side.
   * Use `stacked` for fields that live inside a single-column layout (e.g. Proposal).
   * Default (false) is side-by-side, used for detail sections in the two-column grid.
   */
  stacked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update-field', 'editing-change'])

const slots = useBilingualSlots({
  language: toRef(props, 'language'),
  bilingual: toRef(props, 'bilingual'),
  labelen: toRef(props, 'labelen'),
  labelfr: toRef(props, 'labelfr'),
  text: toRef(props, 'text'),
})
</script>

<template>
  <div
    :class="stacked
      ? 'my-2 space-y-4'
      : ['mt-5 flex gap-6', bilingual ? 'flex-row' : 'flex-col']"
  >
    <MarkdownField
      v-for="slot in slots"
      :key="slot.key"
      class="flex-1"
      :label="slot.label"
      :text="slot.value"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => emit('update-field', { key: slot.key, value })"
    />
  </div>
</template>
