import { computed } from 'vue'

/**
 * Returns a computed array of `{ key, label, value }` slot descriptors in the
 * correct display order for the active language / bilingual setting.
 *
 * Slot order rules:
 *   - Monolingual EN  → [en]
 *   - Monolingual FR  → [fr]
 *   - Bilingual EN    → [en, fr]   (EN primary, FR secondary)
 *   - Bilingual FR    → [fr, en]   (FR primary, EN secondary)
 *
 * @param {{ language: import('vue').Ref<string>, bilingual: import('vue').Ref<boolean>, labelen: import('vue').Ref<string>, labelfr: import('vue').Ref<string>, text: import('vue').Ref<object> }} refs
 */
export function useBilingualSlots({ language, bilingual, labelen, labelfr, text }) {
  return computed(() => {
    const primary = language.value === 'fr' ? 'fr' : 'en'
    const secondary = primary === 'en' ? 'fr' : 'en'

    const labelMap = { en: labelen.value, fr: labelfr.value }
    const valueMap = (key) => {
      if (typeof text.value === 'string') {
        return text.value
      }

      if (typeof text.value === 'object' && text.value !== null) {
        return text.value[key] ?? ''
      }

      return ''
    }

    const slots = [{ key: primary, label: labelMap[primary], value: valueMap(primary) }]

    if (bilingual.value) {
      slots.push({ key: secondary, label: labelMap[secondary], value: valueMap(secondary) })
    }

    return slots
  })
}

/**
 * Plain (non-reactive) version of useBilingualSlots — accepts plain values instead of refs.
 * Safe to call inside v-for template expressions or computed functions that iterate arrays.
 */
export function bilingualSlots(language, bilingual, labelen, labelfr, text) {
  const primary = language === 'fr' ? 'fr' : 'en'
  const secondary = primary === 'en' ? 'fr' : 'en'

  const labelMap = { en: labelen, fr: labelfr }
  const valueMap = (key) => (typeof text === 'object' && text !== null ? text[key] ?? '' : '')

  const slots = [{ key: primary, label: labelMap[primary], value: valueMap(primary) }]

  if (bilingual) {
    slots.push({ key: secondary, label: labelMap[secondary], value: valueMap(secondary) })
  }

  return slots
}
