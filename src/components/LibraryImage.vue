<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    default: () => ({}),
  },
  imageLibrary: {
    type: Array,
    default: () => [],
  },
  resizable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:image', 'save'])

const selectedImageId = ref('')
const localSize = ref(null)
let saveTimer = null

watch(
  () => props.image,
  (value) => {
    selectedImageId.value = value?.id ?? ''
    localSize.value = value?.sizeInches ?? null
  },
  { immediate: true, deep: true },
)

const containerStyle = computed(() => {
  if (!props.resizable || !localSize.value) {
    return {}
  }

  return {
    height: `${localSize.value * 96}px`,
  }
})

function queueSave() {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => emit('save'), 500)
}

function selectImage(id) {
  const sourceImage = props.imageLibrary.find((image) => String(image.id) === String(id))
  if (!sourceImage) {
    return
  }

  emit('update:image', { ...sourceImage })
  emit('save')
}

function removeImage() {
  emit('update:image', {})
  emit('save')
}

function updateSize() {
  if (!props.image || typeof props.image !== 'object') {
    return
  }

  emit('update:image', {
    ...props.image,
    sizeInches: localSize.value,
  })
  queueSave()
}
</script>

<template>
  <div
    v-if="image?.url"
    class="group relative flex h-full w-full items-center justify-center transition-all duration-300 ease-in-out"
    :style="containerStyle"
  >
    <img :src="image.url" class="max-h-full max-w-full object-contain">

    <div v-if="!disabled">
      <div
        v-if="resizable"
        class="absolute bottom-14 left-1/2 -translate-x-1/2 opacity-0 transition group-hover:opacity-100"
      >
        <input
          v-model.number="localSize"
          type="number"
          min="0"
          step="0.25"
          class="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          @change="updateSize"
        >
      </div>

      <button
        type="button"
        class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-slate-700 px-3 py-1 text-sm text-white opacity-0 transition group-hover:opacity-100"
        @click="removeImage"
      >
        Remove
      </button>
    </div>
  </div>

  <div v-else class="text-sm text-slate-600">
    <p v-if="!imageLibrary.length">No images found in project.</p>

    <div v-else class="space-y-2">
      <label class="block font-medium text-slate-700" for="image-select">Choose an image</label>
      <select
        id="image-select"
        v-model="selectedImageId"
        class="w-full rounded border border-slate-300 bg-white px-3 py-2"
        :disabled="disabled"
        @change="selectImage(selectedImageId)"
      >
        <option disabled value="">Select...</option>
        <option v-for="entry in imageLibrary" :key="entry.id" :value="entry.id">
          {{ entry.filename }}
        </option>
      </select>
    </div>
  </div>
</template>
