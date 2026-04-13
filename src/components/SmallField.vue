<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:text', 'editing-change'])

const isEditing = ref(false)
const editText = ref('')
const originalText = ref('')
const inputRef = ref(null)

const canEdit = computed(() => props.editable && !props.disabled)

async function toggleEdit(forceSave = true) {
  if (!canEdit.value && !isEditing.value) {
    return
  }

  if (!isEditing.value) {
    editText.value = props.text
    originalText.value = props.text
    isEditing.value = true
    emit('editing-change', true)
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
    return
  }

  if (forceSave && editText.value !== originalText.value) {
    emit('update:text', editText.value)
  }

  isEditing.value = false
  emit('editing-change', false)
}

function handleKeydown(event) {
  if (event.key === 'Enter') {
    toggleEdit(true)
    return
  }

  if (event.key === 'Escape') {
    editText.value = originalText.value
    toggleEdit(false)
  }
}

onBeforeUnmount(() => {
  if (isEditing.value) {
    emit('editing-change', false)
  }
})
</script>

<template>
  <div class="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 text-sm">
    <div class="font-semibold uppercase tracking-[0.12em] text-[11px] text-slate-500">{{ label }}</div>

    <button
      v-if="!isEditing"
      type="button"
      class="min-h-5 text-left"
      :class="canEdit ? 'cursor-pointer transition hover:text-sky-700' : ''"
      @click="toggleEdit(true)"
    >
      {{ text }}
    </button>

    <input
      v-else
      ref="inputRef"
      v-model="editText"
      type="text"
      class="w-full rounded border border-slate-300 bg-white px-2 py-1"
      @blur="toggleEdit(true)"
      @keydown="handleKeydown"
    >
  </div>
</template>
