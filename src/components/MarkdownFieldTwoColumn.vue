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
  <div class="mt-5 flex gap-6" :class="bilingual ? 'flex-row' : 'flex-col'">
    <MarkdownField
      v-if="language === 'en'"
      class="flex-1"
      :label="labelen"
      :text="text.en"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('en', value)"
    />
    <MarkdownField
      v-if="language === 'fr'"
      class="flex-1"
      :label="labelfr"
      :text="text.fr"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('fr', value)"
    />
    <MarkdownField
      v-if="bilingual && language === 'fr'"
      class="flex-1"
      :label="labelen"
      :text="text.en"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('en', value)"
    />
    <MarkdownField
      v-if="bilingual && language === 'en'"
      class="flex-1"
      :label="labelfr"
      :text="text.fr"
      :disabled="disabled"
      @editing-change="(value) => emit('editing-change', value)"
      @update:text="(value) => handleUpdate('fr', value)"
    />
  </div>
</template>
