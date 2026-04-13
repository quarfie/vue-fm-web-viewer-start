<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true,
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

function setEditing(value) {
  if (isEditing.value === value) {
    return
  }

  isEditing.value = value
  emit('editing-change', value)
}

async function startEditing() {
  if (props.disabled) {
    return
  }

  editText.value = props.text
  originalText.value = props.text
  setEditing(true)
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function stopEditing(save) {
  if (!isEditing.value) {
    return
  }

  if (save && editText.value !== originalText.value) {
    emit('update:text', editText.value)
  }

  if (!save) {
    editText.value = originalText.value
  }

  setEditing(false)
}

function handleKeydown(event) {
  if (event.key === 'Enter') {
    stopEditing(true)
    return
  }

  if (event.key === 'Escape') {
    stopEditing(false)
  }
}

onBeforeUnmount(() => {
  if (isEditing.value) {
    emit('editing-change', false)
  }
})
</script>

<template>
  <div>
    <button
      v-if="!isEditing && text"
      type="button"
      class="cursor-pointer text-left transition hover:text-sky-700"
      :disabled="disabled"
      @click="startEditing"
    >
      {{ text }}
    </button>

    <button
      v-else-if="!isEditing"
      type="button"
      class="cursor-pointer text-left text-slate-500 transition hover:text-sky-700"
      :disabled="disabled"
      @click="startEditing"
    >
      [click to edit text]
    </button>

    <input
      v-else
      ref="inputRef"
      v-model="editText"
      type="text"
      class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm"
      @blur="stopEditing(true)"
      @keydown="handleKeydown"
    >
  </div>
</template>
