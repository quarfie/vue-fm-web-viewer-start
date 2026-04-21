<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import PublicNoticeReport from '@/templates/PublicNoticeReport.vue'
import StaffReport from '@/templates/StaffReport.vue'
import { exposeToFileMaker, fmPerform, onSetup } from '@/fm'
import { model } from '@/model'
import { sanitizeForPersist } from '@/payloadUtils'
import defaultHeaderSvg from '@/assets/svgHeader.svg?raw'
import defaultFooterSvg from '@/assets/svgFooter.svg?raw'

const activeEditorCount = ref(0)
const imageLibrary = ref([])
const suppressAutoSave = ref(true)

const DEFAULT_LEGEND_COLOR = '#fdba74'
const LOCALIZED_FIELD_KEYS = [
  'to',
  'subject',
  'meetingDate',
  'agendaItem',
  'proposal',
  'lotSize',
  'location',
  'zoning',
  'futureUse',
  'currentUse',
  'surroundingUse',
  'municipalServices',
  'access',
]
const STRING_FIELD_KEYS = ['fileNumber', 'applicant', 'landowner', 'pid', 'municipality']

const isFinal = computed(() => model.meta.status === 'final')
const currentLanguage = computed(() => model.meta.language ?? 'en')
const bilingual = computed(() => Boolean(model.meta.bilingual))
const activeTemplateName = computed(() => {
  const name = model.template?.name
  return typeof name === 'string' ? name.trim() : ''
})
const isTemplateLoading = computed(() => !activeTemplateName.value)
const isUnknownTemplate = computed(() => {
  return Boolean(activeTemplateName.value) && !['StaffReport', 'PublicNotice'].includes(activeTemplateName.value)
})
const headerSvgMarkup = computed(() => defaultHeaderSvg)
const footerSvgMarkup = computed(() => defaultFooterSvg)
const attachmentsJson = computed(() => JSON.stringify(model.content.attachments ?? []))
const fileNumberForFilename = computed(() => {
  const value = model.content?.fields?.fileNumber
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    if (typeof value.bi === 'string') {
      return value.bi
    }

    if (typeof value.en === 'string') {
      return value.en
    }
  }

  return ''
})
const meetingDateForFilename = computed(() => {
  const meetingDate = model.content?.fields?.meetingDate
  if (meetingDate && typeof meetingDate === 'object') {
    if (typeof meetingDate.en === 'string' && meetingDate.en.trim()) {
      return ` ${meetingDate.en}`
    }

    const year = Number(meetingDate?.year)
    const month = Number(meetingDate?.month)
    const day = Number(meetingDate?.day)
    if (year && month && day) {
      return ` ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  if (typeof meetingDate === 'string' && meetingDate.trim()) {
    return ` ${meetingDate}`
  }

  return ''
})
const statusLabel = computed(() => {
  const value = model.meta.status ?? 'draft'
  return value.charAt(0).toUpperCase() + value.slice(1)
})


function handleEditingChange(isEditing) {
  activeEditorCount.value = Math.max(0, activeEditorCount.value + (isEditing ? 1 : -1))
}

function toLocalizedText(value) {
  if (typeof value === 'string') {
    return { en: value, fr: value }
  }

  if (value && typeof value === 'object') {
    return {
      en: value.en ?? '',
      fr: value.fr ?? '',
    }
  }

  return { en: '', fr: '' }
}

function toNeutralString(value) {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    return value.bi ?? ''
  }

  return ''
}

function normalizeStaffReportTemplate() {
  model.template.options.type = model.template.options.type ?? 'prac'
  model.template.options.property = model.template.options.property !== false

  for (const key of LOCALIZED_FIELD_KEYS) {
    model.content.fields[key] = toLocalizedText(model.content.fields[key])
  }

  for (const key of STRING_FIELD_KEYS) {
    model.content.fields[key] = toNeutralString(model.content.fields[key])
  }

  model.content.detail = model.content.detail.map((section) => ({
    name: toLocalizedText(section?.name),
    value: toLocalizedText(section?.value),
  }))

  const propertyLocation = model.content.images?.propertyLocation
  const oldStyleImage = propertyLocation && typeof propertyLocation === 'object' && 'url' in propertyLocation

  const normalizedImage = oldStyleImage
    ? { ...propertyLocation }
    : propertyLocation?.image && typeof propertyLocation.image === 'object'
      ? propertyLocation.image
      : {}

  const currentLegendColor = propertyLocation?.data?.legendColor
  const normalizedLegendColor = typeof currentLegendColor === 'string' && currentLegendColor.trim()
    ? currentLegendColor
    : DEFAULT_LEGEND_COLOR

  model.content.images.propertyLocation = {
    image: normalizedImage,
    data: {
      ...(propertyLocation?.data ?? {}),
      legendColor: normalizedLegendColor,
    },
  }
}

function normalizePublicNoticeTemplate() {
  model.content.fields.subject = toLocalizedText(model.content.fields.subject)
  model.content.fields.description = toLocalizedText(model.content.fields.description)
  model.content.fields.location = toLocalizedText(model.content.fields.location)
  model.content.fields.fileNumber = model.content.fields.fileNumber && typeof model.content.fields.fileNumber === 'object'
    ? { bi: model.content.fields.fileNumber.bi ?? '' }
    : { bi: typeof model.content.fields.fileNumber === 'string' ? model.content.fields.fileNumber : '' }
  model.content.fields.pid = model.content.fields.pid && typeof model.content.fields.pid === 'object'
    ? { bi: model.content.fields.pid.bi ?? '' }
    : { bi: typeof model.content.fields.pid === 'string' ? model.content.fields.pid : '' }
  model.content.fields.date = model.content.fields.date && typeof model.content.fields.date === 'object'
    ? {
        day: Number(model.content.fields.date.day) || 0,
        month: Number(model.content.fields.date.month) || 0,
        year: Number(model.content.fields.date.year) || 0,
      }
    : { day: 0, month: 0, year: 0 }
  model.content.fields.meetingDate = model.content.fields.meetingDate && typeof model.content.fields.meetingDate === 'object'
    ? {
        day: Number(model.content.fields.meetingDate.day) || 0,
        month: Number(model.content.fields.meetingDate.month) || 0,
        year: Number(model.content.fields.meetingDate.year) || 0,
      }
    : { day: 0, month: 0, year: 0 }

  const municipality = model.content.data.municipality && typeof model.content.data.municipality === 'object'
    ? model.content.data.municipality
    : {}
  const reviewCommittee = municipality.reviewCommittee && typeof municipality.reviewCommittee === 'object'
    ? municipality.reviewCommittee
    : {}
  const meeting = reviewCommittee.meeting && typeof reviewCommittee.meeting === 'object'
    ? reviewCommittee.meeting
    : {}

  model.content.data = {
    municipality: {
      ...municipality,
      name: toLocalizedText(municipality.name),
      reviewCommittee: {
        ...reviewCommittee,
        name: toLocalizedText(reviewCommittee.name),
        meeting: {
          ...meeting,
          location: toLocalizedText(meeting.location),
          address: toLocalizedText(meeting.address),
          noticeUrl: toLocalizedText(meeting.noticeUrl),
          time: meeting.time && typeof meeting.time === 'object'
            ? {
                hour: Number(meeting.time.hour) || 0,
                minute: Number(meeting.time.minute) || 0,
              }
            : { hour: 0, minute: 0 },
        },
      },
    },
  }
}

const TEMPLATE_NORMALIZERS = {
  StaffReport: normalizeStaffReportTemplate,
  PublicNotice: normalizePublicNoticeTemplate,
}

function normalizeModelData() {
  model.schemaVersion = Number.isFinite(Number(model.schemaVersion)) ? Number(model.schemaVersion) : 2
  model.meta.status = model.meta.status ?? 'draft'
  model.meta.language = model.meta.language ?? 'en'
  model.meta.bilingual = Boolean(model.meta.bilingual)
  model.meta.pageSize = model.meta.pageSize ?? 'Letter'
  model.template = model.template && typeof model.template === 'object' ? model.template : {}
  model.template.name = typeof model.template.name === 'string' ? model.template.name.trim() : ''
  model.template.options = model.template.options && typeof model.template.options === 'object'
    ? model.template.options
    : {}

  model.content = model.content && typeof model.content === 'object' ? model.content : {}
  model.content.fields = model.content.fields && typeof model.content.fields === 'object' ? model.content.fields : {}
  model.content.detail = Array.isArray(model.content.detail) ? model.content.detail : []
  model.content.images = model.content.images && typeof model.content.images === 'object' ? model.content.images : {}
  model.content.signatures = Array.isArray(model.content.signatures) ? model.content.signatures : []
  model.content.exhibits = Array.isArray(model.content.exhibits) ? model.content.exhibits : []
  model.content.attachments = Array.isArray(model.content.attachments) ? model.content.attachments : []
  model.content.data = model.content.data && typeof model.content.data === 'object' ? model.content.data : {}

  model.content.exhibits = model.content.exhibits.map((exhibit) => ({
    ...exhibit,
    title: toLocalizedText(exhibit?.title),
    description: toLocalizedText(exhibit?.description),
    images: exhibit?.images && typeof exhibit.images === 'object' ? exhibit.images : {},
  }))

  const normalizeTemplate = TEMPLATE_NORMALIZERS[model.template.name]
  if (typeof normalizeTemplate === 'function') {
    normalizeTemplate()
  }
}

function updateLegendColor(event) {
  const nextColor = event?.target?.value
  if (typeof nextColor !== 'string' || !nextColor) {
    return
  }

  model.content.images.propertyLocation.data.legendColor = nextColor
  saveToFM()
}

function saveToFM() {
  fmPerform('JS Save Report JSON', {
    script: 'JS Save Report JSON',
    model: sanitizeForPersist(model),
  })
}

function setLanguage(language) {
  model.meta.language = language
  saveToFM()
}

function togglePageSize() {
  model.meta.pageSize = model.meta.pageSize === 'Legal' ? 'Letter' : 'Legal'
  saveToFM()
}

function getImagesList() {
  fmPerform('JS-FM Get Images List', {
    script: 'JS-FM Return Images List',
    callback: 'insertImagesList',
  })
}

function insertImagesList(imagesJson) {
  try {
    const parsed = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson
    imageLibrary.value = Array.isArray(parsed) ? parsed : []
  } catch {
    imageLibrary.value = []
  }
}

function insertSignature(idRole, user) {
  let userObject = user

  if (typeof user === 'string') {
    try {
      userObject = JSON.parse(user)
    } catch {
      return
    }
  }

  const signature = model.content.signatures.find((entry) => entry.id_Role === idRole)

  if (!signature) {
    return
  }

  signature.user = userObject
  saveToFM()
}

function requestSignature(signature) {
  fmPerform('JS Sign Document', {
    script: 'JS Sign Document',
    callback: 'insertSignature',
    id_Role: signature.id_Role,
  })
}

function removeSignature(signature) {
  signature.user = null
  saveToFM()
}

function getAsHtml() {
  const clone = document.documentElement.cloneNode(true)

  clone.querySelectorAll('script').forEach((element) => element.remove())
  clone.querySelectorAll('link').forEach((element) => {
    if (
      !element.href.includes('fonts.googleapis.com') &&
      !element.href.includes('fonts.gstatic.com') &&
      element.rel !== 'stylesheet'
    ) {
      element.remove()
    }
  })

  fmPerform('Receive Report HTML', {
    script: 'Receive Report HTML',
    source: clone.outerHTML,
  })
}

function finalize() {
  if (activeEditorCount.value > 0) {
    window.alert('You have unsaved changes!')
    return
  }

  if (model.content.signatures.some((signature) => !signature.user || typeof signature.user !== 'object')) {
    window.alert('The document must be signed first.')
    return
  }

  model.meta.status = 'final'
  saveToFM()
}

function addExhibit(selectedType) {
  if (!selectedType) {
    return
  }

  const exhibitTitle = typeof selectedType === 'string'
    ? { en: selectedType, fr: selectedType }
    : { ...selectedType }

  model.content.exhibits.push({
    title: exhibitTitle,
    description: { en: '', fr: '' },
    images: {},
  })

  saveToFM()
}

function updatePropertyLocationImage(value) {
  model.content.images.propertyLocation.image = value
  saveToFM()
}

function updateFieldValue(fieldKey, payload) {
  const field = model.content.fields[fieldKey]
  if (field === undefined) {
    return
  }

  if (typeof field === 'string') {
    model.content.fields[fieldKey] = payload?.value ?? ''
    saveToFM()
    return
  }

  if (!payload?.key || !field || typeof field !== 'object') {
    return
  }

  field[payload.key] = payload.value
  saveToFM()
}

function updateSectionField(payload) {
  const section = model.content.detail[payload.index]
  if (!section?.value) {
    return
  }

  section.value[payload.key] = payload.value
  saveToFM()
}

function moveExhibit(payload) {
  const target = payload.index + payload.direction
  if (target < 0 || target >= model.content.exhibits.length) {
    return
  }

  const current = model.content.exhibits[payload.index]
  model.content.exhibits[payload.index] = model.content.exhibits[target]
  model.content.exhibits[target] = current
  saveToFM()
}

function removeExhibit(payload) {
  model.content.exhibits.splice(payload.index, 1)
  saveToFM()
}

function updateExhibitTitle(payload) {
  const exhibit = model.content.exhibits[payload.index]
  if (!exhibit?.title) {
    return
  }

  exhibit.title[payload.key] = payload.value
  saveToFM()
}

function updateExhibitDescription(payload) {
  const exhibit = model.content.exhibits[payload.index]
  if (!exhibit?.description) {
    return
  }

  exhibit.description[payload.key] = payload.value
  saveToFM()
}

function updateExhibitImage(payload) {
  const exhibit = model.content.exhibits[payload.index]
  if (!exhibit) {
    return
  }

  if (!exhibit.images || typeof exhibit.images !== 'object') {
    exhibit.images = {}
  }

  exhibit.images.a = payload.value
  saveToFM()
}

watch(
  () => model.meta.bilingual,
  () => {
    if (suppressAutoSave.value) {
      return
    }

    saveToFM()
  },
)

onSetup(async () => {
  suppressAutoSave.value = true
  normalizeModelData()
  getImagesList()
  await nextTick()
  suppressAutoSave.value = false
})

onMounted(() => {
  exposeToFileMaker('getAsHtml', getAsHtml)
  exposeToFileMaker('insertImagesList', insertImagesList)
  exposeToFileMaker('insertSignature', insertSignature)
  suppressAutoSave.value = true
  normalizeModelData()
  getImagesList()
})
</script>

<template>
  <div class="min-h-screen bg-stone-300 text-slate-900">
    <div
      id="toolbar"
      class="fixed inset-x-0 top-0 z-50 flex min-h-14 flex-wrap items-center gap-3 border-b border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur"
    >
      <template v-if="!isFinal">
        <span class="text-sm font-medium text-slate-600">Language</span>
        <div class="inline-flex overflow-hidden rounded-full border border-sky-200 bg-sky-50 text-sm text-sky-700">
          <button
            type="button"
            class="px-3 py-1.5"
            :class="currentLanguage === 'en' ? 'bg-sky-500 text-white' : ''"
            @click="setLanguage('en')"
          >
            EN
          </button>
          <button
            type="button"
            class="px-3 py-1.5"
            :class="currentLanguage === 'fr' ? 'bg-sky-500 text-white' : ''"
            @click="setLanguage('fr')"
          >
            FR
          </button>
        </div>

        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
          <input v-model="model.meta.bilingual" type="checkbox" class="rounded border-slate-300">
          Bilingual
        </label>
      </template>

      <button type="button" class="toolbar-button" @click="getAsHtml">Save PDF</button>
      <button type="button" class="toolbar-button" @click="togglePageSize">{{ model.meta.pageSize || 'Letter' }}</button>
      <button v-if="!isFinal" type="button" class="toolbar-button" @click="finalize">Finalize</button>
      <span class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{{ statusLabel }}</span>
    </div>

    <main class="px-4 pb-10 pt-24">
      <section id="page" class="mx-auto w-full max-w-204 bg-white px-8 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
        <span id="filename" class="hidden">
          {{ model.meta.status === 'final' ? '' : 'DRAFT ' }}{{ model.template.name }} {{ fileNumberForFilename }}{{ meetingDateForFilename }}
        </span>
        <span id="pageSize" class="hidden">{{ model.meta.pageSize || 'Letter' }}</span>
        <span id="attachments" class="hidden">{{ attachmentsJson }}</span>

        <header class="report-header">
          <div class="w-120" v-html="headerSvgMarkup" />
          <div class="text-right text-[16px] text-slate-600">
            <span class="pageNumber" /> / <span class="totalPages" />
          </div>
        </header>

        <StaffReport
          v-if="activeTemplateName === 'StaffReport'"
          :model="model"
          :current-language="currentLanguage"
          :bilingual="bilingual"
          :is-final="isFinal"
          :image-library="imageLibrary"
          @update-field-value="updateFieldValue"
          @update-section-field="updateSectionField"
          @move-exhibit="moveExhibit"
          @remove-exhibit="removeExhibit"
          @update-exhibit-title="updateExhibitTitle"
          @update-exhibit-description="updateExhibitDescription"
          @update-exhibit-image="updateExhibitImage"
          @save-to-fm="saveToFM"
          @update-property-location-image="updatePropertyLocationImage"
          @update-legend-color="updateLegendColor"
          @remove-signature="removeSignature"
          @request-signature="requestSignature"
          @add-exhibit="addExhibit"
          @editing-change="handleEditingChange"
        />

        <PublicNoticeReport
          v-else-if="activeTemplateName === 'PublicNotice'"
          :model="model"
          :current-language="currentLanguage"
          :bilingual="bilingual"
          :is-final="isFinal"
          :image-library="imageLibrary"
          @move-exhibit="moveExhibit"
          @remove-exhibit="removeExhibit"
          @update-exhibit-title="updateExhibitTitle"
          @update-exhibit-description="updateExhibitDescription"
          @update-exhibit-image="updateExhibitImage"
          @remove-signature="removeSignature"
          @request-signature="requestSignature"
          @add-exhibit="addExhibit"
          @save-to-fm="saveToFM"
          @editing-change="handleEditingChange"
        />

        <div v-else-if="isTemplateLoading" class="py-20 text-center text-slate-600">
          <div class="spinner mx-auto mb-4" aria-hidden="true" />
          <p class="text-base font-medium">Loading report template...</p>
        </div>

        <div v-else-if="isUnknownTemplate" class="py-20 text-center text-slate-700">
          <p class="text-base font-semibold">Unknown template: {{ activeTemplateName }}</p>
          <p class="mt-2 text-sm">Check the payload template.name value.</p>
        </div>

        <footer class="report-footer" v-html="footerSvgMarkup" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.toolbar-button {
  border: 1px solid #7dd3fc;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  color: #0369a1;
  font-size: 0.875rem;
  font-weight: 600;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #cbd5e1;
  border-top-color: #0284c7;
  border-radius: 999px;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

#page {
  font-family: 'Avenir Next', 'Helvetica Neue', sans-serif;
}

.report-header {
  width: 7.5in;
  margin: auto;
  display: flex;
  justify-content: space-between;
  font-family: Arial, sans-serif;
}

.report-footer {
  width: 7.5in;
  margin: 0 auto 0.25in;
}

:deep(.report-markdown ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
}

:deep(.report-markdown ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
}

:deep(.report-markdown li) {
  margin-bottom: 0.25rem;
}

:deep(.report-markdown p) {
  margin-bottom: 0.5rem;
}

:deep(.report-markdown blockquote) {
  border-left: 3px solid #94a3b8;
  margin: 0.5rem 0;
  padding: 0.25rem 0.75rem;
  color: #475569;
  font-style: italic;
}

:deep(.report-markdown table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
}

:deep(.report-markdown th),
:deep(.report-markdown td) {
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.55rem;
  vertical-align: top;
}

:deep(.report-markdown th) {
  background: #f8fafc;
  font-weight: 600;
}

.legend-color-chip {
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid #000;
  border-radius: 0;
  padding: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background: none;
}

.legend-color-chip::-webkit-color-swatch-wrapper {
  padding: 0;
  border-radius: 0;
}

.legend-color-chip::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.legend-color-chip::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

@page {
  margin: 1.75in 0.5in 1.45in;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color: black;
    background-color: transparent;
  }

  #page {
    padding: 0;
    background-color: transparent;
    box-shadow: none;
  }

  #toolbar,
  .no-print {
    display: none;
  }
}
</style>
