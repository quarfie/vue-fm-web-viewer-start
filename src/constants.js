export const exhibitTypes = [
  { en: 'Zoning', fr: 'Zonage' },
  { en: 'Existing Zoning', fr: 'Zonage existant' },
  { en: 'Location', fr: 'Emplacement' },
  { en: 'Proposed Subdivision Plan', fr: 'Plan de lotissement propose' },
  { en: 'Site Photo', fr: 'Photo du site' },
  { en: 'Site Plan', fr: 'Plan du site' },
  { en: 'Floor Plan', fr: "Plan d'etage" },
]

export function createDefaultModel() {
  return {
    schemaVersion: 2,
    meta: {
      status: 'draft',
      language: 'en',
      bilingual: false,
      pageSize: 'Letter',
    },
    template: {
      name: '',
      options: {},
    },
    content: {
      attachments: [],
      fields: {},
      detail: [],
      images: {
        propertyLocation: {
          image: {},
          data: {
            legendColor: '#fdba74',
          },
        },
      },
      data: {},
      signatures: [],
      exhibits: [],
    },
    runtime: {
      error: '',
    },
  }
}

function isPlainObject(value) {
  return Boolean(value) && Object.prototype.toString.call(value) === '[object Object]'
}

export function mergeDefaults(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming.map((item) => mergeDefaults({}, item)) : [...base]
  }

  if (!isPlainObject(base)) {
    return incoming === undefined ? base : incoming
  }

  const result = { ...base }
  if (!isPlainObject(incoming)) {
    return result
  }

  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) => (isPlainObject(item) ? mergeDefaults({}, item) : item))
      continue
    }

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeDefaults(result[key], value)
      continue
    }

    result[key] = value
  }

  return result
}
