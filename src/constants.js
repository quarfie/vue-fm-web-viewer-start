export const exhibitTypes = [
  { en: 'Zoning', fr: 'Zonage' },
  { en: 'Existing Zoning', fr: 'Zonage existant' },
  { en: 'Location', fr: 'Emplacement' },
  { en: 'Proposed Subdivision Plan', fr: 'Plan de lotissement propose' },
  { en: 'Site Photo', fr: 'Photo du site' },
  { en: 'Site Plan', fr: 'Plan du site' },
  { en: 'Floor Plan', fr: "Plan d'etage" },
]

export const reportTypes = [
  {
    type: 'prac',
    name: {
      en: 'Staff Report',
      fr: 'Rapport du personnel',
    },
  },
  {
    _note: 'Amendments only',
    type: 'preliminary',
    name: {
      en: 'Preliminary Staff Report',
      fr: 'Rapport preliminaire du personnel',
    },
  },
  {
    _note: 'Amendments only',
    type: 'public_hearing',
    name: {
      en: 'Public Hearing Report',
      fr: "Rapport d'audience publique",
    },
  },
  {
    _note: 'Amendments only',
    type: 'public_presentation',
    name: {
      en: 'Public Presentation Report',
      fr: 'Rapport de presentation publique',
    },
  },
  {
    _note: 'Subdivisions only',
    type: 'council_subdivision',
    name: {
      en: 'Council Report',
      fr: 'Rapport au conseil',
    },
  },
]

export function createDefaultModel() {
  return {
    error: '',
    status: 'draft',
    language: 'en',
    bilingual: false,
    pageSize: 'Letter',
    type: 'prac',
    id_Project: null,
    attachments: [],
    property: true,
    legendColor: '#fdba74',
    svgHeader: '',
    svgFooter: '',
    to: {
      en: '',
      fr: '',
    },
    fields: {
      subject: { en: '', fr: '' },
      meetingDate: { en: '', fr: '' },
      agendaItem: { en: '', fr: '' },
      fileNumber: { bi: '' },
      applicant: '',
      landowner: '',
      proposal: { en: '', fr: '' },
      pid: { bi: '' },
      lotSize: { en: '', fr: '' },
      location: { en: '', fr: '' },
      municipality: { bi: '' },
      zoning: { en: '', fr: '' },
      futureUse: { en: '', fr: '' },
      currentUse: { en: '', fr: '' },
      surroundingUse: { en: '', fr: '' },
      municipalServices: { en: '', fr: '' },
      access: { en: '', fr: '' },
      detail: [],
    },
    images: {
      propertyLocation: {},
    },
    signatures: [],
    exhibits: [],
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

export function getReportType(type) {
  return reportTypes.find((reportType) => reportType.type === type) ?? reportTypes[0]
}
