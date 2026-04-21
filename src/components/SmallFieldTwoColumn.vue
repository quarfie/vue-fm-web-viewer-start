<script setup>
import { toRef } from 'vue'

import SmallField from '@/components/SmallField.vue'
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
    type: [String, Object],
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
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
})

const emit = defineEmits(['update-field', 'editing-change'])

const sharedArgs = {
  language: toRef(props, 'language'),
  bilingual: toRef(props, 'bilingual'),
  labelen: toRef(props, 'labelen'),
  labelfr: toRef(props, 'labelfr'),
  text: toRef(props, 'text'),
}

const slots = useBilingualSlots(sharedArgs)

function getFieldKey(slotKey) {
  return typeof props.text === 'string' ? null : slotKey
}
</script>

<template>
  <div
    class="my-1 grid gap-x-6 gap-y-2 text-sm"
    :class="bilingual ? 'grid-cols-2' : 'grid-cols-1'"
  >
    <SmallField
      v-for="slot in slots"
      :key="slot.key + slot.label"
      :label="slot.label"
      :text="slot.value"
      :editable="editable"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => emit('update-field', { key: getFieldKey(slot.key), value })"
    />
  </div>
</template>
