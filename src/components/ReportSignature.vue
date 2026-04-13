<script setup>
defineProps({
  signature: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  chooseTranslation: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['sign', 'remove'])
</script>

<template>
  <div>
    <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
      {{ chooseTranslation(signature.label.en, signature.label.fr, ' / ') }}:
    </h3>

    <div v-if="signature.user?.signature">
      <div class="group relative mb-2">
        <img
          :src="`data:image/png;base64,${signature.user.signature}`"
          alt="Signature"
          class="h-[2cm]"
        >

        <button
          v-if="!disabled"
          type="button"
          class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-slate-700 px-3 py-1 text-sm text-white opacity-0 transition group-hover:opacity-100"
          @click="emit('remove')"
        >
          Remove
        </button>
      </div>

      <p>{{ signature.user?.name }}</p>
      <p>{{ chooseTranslation(signature.user?.title?.en ?? '', signature.user?.title?.fr ?? '', ' / ') }}</p>
    </div>

    <button
      v-else
      type="button"
      class="flex h-[2cm] items-center text-slate-500 transition hover:text-sky-700"
      :disabled="disabled"
      @click="emit('sign')"
    >
      <i-material-symbols-signature class="text-5xl" />
    </button>
  </div>
</template>
