<script setup>
import MarkdownField from '@/components/MarkdownField.vue'

defineProps({
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
})

const emit = defineEmits(['update-field', 'editing-change'])

function handleUpdate(key, value) {
  emit('update-field', { key, value })
}
</script>

<template>
  <div class="my-2 space-y-4">
    <MarkdownField
      v-if="language === 'en'"
      :label="labelen"
      :text="text.en"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('en', value)"
    />
    <MarkdownField
      v-if="language === 'fr'"
      :label="labelfr"
      :text="text.fr"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('fr', value)"
    />
    <MarkdownField
      v-if="bilingual && language === 'fr'"
      :label="labelen"
      :text="text.en"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('en', value)"
    />
    <MarkdownField
      v-if="bilingual && language === 'en'"
      :label="labelfr"
      :text="text.fr"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('fr', value)"
    />
  </div>
</template>
