<script setup>
import { ref } from 'vue'

import LibraryImage from '@/components/LibraryImage.vue'
import MarkdownBilingual from '@/components/MarkdownBilingual.vue'
import TextEditable from '@/components/TextEditable.vue'
import { bilingualSlots } from '@/composables/useBilingualSlots'

const props = defineProps({
  exhibits: {
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
  imageLibrary: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'move-exhibit',
  'remove-exhibit',
  'update-exhibit-title',
  'update-exhibit-description',
  'update-exhibit-image',
  'save',
  'editing-change',
])

const confirmingIndex = ref(null)

function moveExhibit(index, direction) {
  const target = index + direction
  if (target < 0 || target >= props.exhibits.length) {
    return
  }

  emit('move-exhibit', { index, direction })
}

function removeExhibit(index) {
  confirmingIndex.value = null
  emit('remove-exhibit', { index })
}

function updateTitle(index, key, value) {
  emit('update-exhibit-title', { index, key, value })
}

function updateDescription(index, key, value) {
  emit('update-exhibit-description', { index, key, value })
}

function updateImage(index, value) {
  emit('update-exhibit-image', { index, value })
}
</script>

<template>
  <div>
    <article
      v-for="(exhibit, index) in exhibits"
      :key="index"
      class="group relative mt-6 break-inside-avoid"
    >
      <div
        v-if="!disabled"
        class="absolute -left-12 top-0 flex flex-col gap-2 opacity-0 transition group-hover:opacity-100"
      >
        <button type="button" class="rounded border border-slate-300 bg-white p-1" @click="moveExhibit(index, -1)">
          <i-material-symbols-keyboard-arrow-up class="text-xl" />
        </button>
        <button
          v-if="confirmingIndex !== index"
          type="button"
          class="rounded border border-red-300 bg-white p-1 text-red-700"
          @click="confirmingIndex = index"
        >
          <i-material-symbols-delete-outline class="text-xl" />
        </button>
        <button
          v-else
          type="button"
          class="rounded bg-red-700 px-2 py-1 text-xs font-semibold text-white"
          @click="removeExhibit(index)"
        >
          Delete
        </button>
        <button type="button" class="rounded border border-slate-300 bg-white p-1" @click="moveExhibit(index, 1)">
          <i-material-symbols-keyboard-arrow-down class="text-xl" />
        </button>
      </div>

      <div class="grid gap-6" :class="bilingual ? 'grid-cols-2' : 'grid-cols-1'">
        <h2
          v-for="slot in bilingualSlots(language, bilingual, '', '', exhibit.title)"
          :key="slot.key"
          class="mb-2 text-lg font-semibold text-slate-900"
        >
          <TextEditable
            :text="slot.value"
            :disabled="disabled"
            @editing-change="(value) => emit('editing-change', value)"
            @update:text="(value) => updateTitle(index, slot.key, value)"
          />
        </h2>
      </div>

      <LibraryImage
        :image="exhibit.images.a"
        :image-library="imageLibrary"
        :resizable="true"
        :disabled="disabled"
        @save="emit('save')"
        @update:image="(value) => updateImage(index, value)"
      />

      <MarkdownBilingual
        class="mt-4"
        labelen=""
        labelfr=""
        :text="exhibit.description"
        :language="language"
        :bilingual="bilingual"
        :disabled="disabled"
        @editing-change="(value) => emit('editing-change', value)"
        @update-field="({ key, value }) => updateDescription(index, key, value)"
      />
    </article>
  </div>
</template>
