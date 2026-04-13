<script setup>
import MarkdownBilingual from '@/components/MarkdownBilingual.vue'

defineProps({
  sections: {
    type: Array,
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

const emit = defineEmits(['update-section-field', 'editing-change'])
</script>

<template>
  <div>
    <div v-for="(section, index) in sections" :key="index" class="break-inside-avoid mt-5">
      <MarkdownBilingual
        :labelen="section.name?.en ?? ''"
        :labelfr="section.name?.fr ?? ''"
        :text="section.value"
        :language="language"
        :bilingual="bilingual"
        :disabled="disabled"
        @update-field="({ key, value }) => emit('update-section-field', { index, key, value })"
        @editing-change="(value) => emit('editing-change', value)"
      />
    </div>
  </div>
</template>
