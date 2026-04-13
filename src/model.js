import { reactive } from 'vue'

import { createDefaultModel, mergeDefaults } from '@/constants'

export const model = reactive(createDefaultModel())

export function replaceModel(nextModel = {}) {
  const merged = mergeDefaults(createDefaultModel(), nextModel)

  for (const key of Object.keys(model)) {
    delete model[key]
  }

  Object.assign(model, merged)
}
