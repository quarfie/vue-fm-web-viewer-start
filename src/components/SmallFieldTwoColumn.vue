<script setup>
import SmallField from '@/components/SmallField.vue'

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

function handleUpdate(key, value) {
  emit('update-field', { key, value })
}
</script>

<template>
  <div
    class="my-1 grid gap-x-6 gap-y-2 text-sm"
    :class="bilingual ? 'grid-cols-2' : 'grid-cols-1'"
  >
    <template v-if="'bi' in text">
      <SmallField
        v-if="language === 'en'"
        :label="labelen"
        :text="text.bi"
        :editable="editable"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update:text="(value) => handleUpdate('bi', value)"
      />
      <SmallField
        v-if="language === 'fr' || bilingual"
        :label="labelfr"
        :text="text.bi"
        :editable="editable"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update:text="(value) => handleUpdate('bi', value)"
      />
      <SmallField
        v-if="language === 'fr' && bilingual"
        :label="labelen"
        :text="text.bi"
        :editable="editable"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update:text="(value) => handleUpdate('bi', value)"
      />
    </template>

    <template v-else>
      <SmallField
        v-if="language === 'en'"
        :label="labelen"
        :text="text.en"
        :editable="editable"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update:text="(value) => handleUpdate('en', value)"
      />
      <SmallField
        v-if="language === 'fr' || bilingual"
        :label="labelfr"
        :text="text.fr"
        :editable="editable"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update:text="(value) => handleUpdate('fr', value)"
      />
      <SmallField
        v-if="language === 'fr' && bilingual"
        :label="labelen"
        :text="text.en"
        :editable="editable"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update:text="(value) => handleUpdate('en', value)"
      />
    </template>
  </div>
</template>
