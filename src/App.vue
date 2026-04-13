<script setup>
import { computed, onMounted, ref, toRaw, watch } from 'vue'

import BodySections from '@/components/BodySections.vue'
import ExhibitsList from '@/components/ExhibitsList.vue'
import LibraryImage from '@/components/LibraryImage.vue'
import MarkdownBilingual from '@/components/MarkdownBilingual.vue'
import ReportSignature from '@/components/ReportSignature.vue'
import SmallFieldTwoColumn from '@/components/SmallFieldTwoColumn.vue'
import { exhibitTypes, getReportType } from '@/constants'
import { exposeToFileMaker, fmPerform, onSetup } from '@/fm'
import { model } from '@/model'
import defaultHeaderSvg from '@/assets/svgHeader.svg?raw'
import defaultFooterSvg from '@/assets/svgFooter.svg?raw'

const activeEditorCount = ref(0)
const imageLibrary = ref([])
const selectedExhibit = ref('')

const DEFAULT_LEGEND_COLOR = '#fdba74'

const isFinal = computed(() => model.status === 'final')
const currentLanguage = computed(() => model.language ?? 'en')
const bilingual = computed(() => Boolean(model.bilingual))
const currentReportType = computed(() => getReportType(model.type))
const headerSvgMarkup = computed(() => model.svgHeader || defaultHeaderSvg)
const footerSvgMarkup = computed(() => model.svgFooter || defaultFooterSvg)
const statusLabel = computed(() => {
  const value = model.status ?? 'draft'
  return value.charAt(0).toUpperCase() + value.slice(1)
})

function chooseTranslation(en, fr, delimiter = '') {
  const primary = currentLanguage.value === 'en' ? en : fr
  const secondary = currentLanguage.value === 'en' ? fr : en
  return `${primary}${bilingual.value ? delimiter : ''}${bilingual.value ? secondary : ''}`
}

function handleEditingChange(isEditing) {
  activeEditorCount.value = Math.max(0, activeEditorCount.value + (isEditing ? 1 : -1))
}

function normalizeModelData() {
  model.legendColor = typeof model.legendColor === 'string' && model.legendColor.trim()
    ? model.legendColor
    : DEFAULT_LEGEND_COLOR

  model.fields.detail = Array.isArray(model.fields.detail)
    ? model.fields.detail.map((section) => ({
        name: {
          en: section?.name?.en ?? '',
          fr: section?.name?.fr ?? '',
        },
        value: {
          en: section?.value?.en ?? '',
          fr: section?.value?.fr ?? '',
        },
      }))
    : []

  model.exhibits = Array.isArray(model.exhibits)
    ? model.exhibits.map((exhibit) => ({
        ...exhibit,
        title: {
          en: exhibit?.title?.en ?? '',
          fr: exhibit?.title?.fr ?? '',
        },
        description: {
          en: exhibit?.description?.en ?? '',
          fr: exhibit?.description?.fr ?? '',
        },
        images: exhibit?.images && typeof exhibit.images === 'object' ? exhibit.images : {},
      }))
    : []

  model.signatures = Array.isArray(model.signatures) ? model.signatures : []
}

function updateLegendColor(event) {
  const nextColor = event?.target?.value
  if (typeof nextColor !== 'string' || !nextColor) {
    return
  }

  model.legendColor = nextColor
  saveToFM()
}

function sanitizeModelForSave() {
  const clone = JSON.parse(JSON.stringify(toRaw(model)))

  if (clone.images && typeof clone.images === 'object') {
    for (const image of Object.values(clone.images)) {
      if (image && typeof image === 'object') {
        delete image.url
      }
    }
  }

  if (Array.isArray(clone.signatures)) {
    for (const signature of clone.signatures) {
      if (signature?.user && typeof signature.user === 'object') {
        delete signature.user.signature
      }
    }
  }

  if (Array.isArray(clone.exhibits)) {
    for (const exhibit of clone.exhibits) {
      if (!exhibit?.images || typeof exhibit.images !== 'object') {
        continue
      }

      for (const image of Object.values(exhibit.images)) {
        if (image && typeof image === 'object') {
          delete image.url
        }
      }
    }
  }

  clone.attachments = []
  return clone
}

function saveToFM() {
  fmPerform('JS Save Report JSON', {
    script: 'JS Save Report JSON',
    model: sanitizeModelForSave(),
  })
}

function setLanguage(language) {
  model.language = language
  saveToFM()
}

function togglePageSize() {
  model.pageSize = model.pageSize === 'Legal' ? 'Letter' : 'Legal'
  saveToFM()
}

function getImagesList() {
  if (!model.id_Project) {
    imageLibrary.value = []
    return
  }

  fmPerform('JS-FM Get Images List', {
    script: 'JS-FM Return Images List',
    callback: 'insertImagesList',
    id_Project: model.id_Project,
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

  const signature = model.signatures.find((entry) => entry.id_Role === idRole)

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

  if (model.signatures.some((signature) => !signature.user || typeof signature.user !== 'object')) {
    window.alert('The document must be signed first.')
    return
  }

  model.status = 'final'
  saveToFM()
}

function addExhibit() {
  if (!selectedExhibit.value) {
    return
  }

  const exhibitTitle = typeof selectedExhibit.value === 'string'
    ? { en: selectedExhibit.value, fr: selectedExhibit.value }
    : { ...selectedExhibit.value }

  model.exhibits.push({
    title: exhibitTitle,
    description: { en: '', fr: '' },
    images: {},
  })

  selectedExhibit.value = ''
  saveToFM()
}

function updatePropertyLocationImage(value) {
  model.images.propertyLocation = value
  saveToFM()
}

function updateFieldValue(field, payload) {
  if (!field || typeof field !== 'object' || !payload?.key) {
    return
  }

  field[payload.key] = payload.value
  saveToFM()
}

function updateSectionField(payload) {
  const section = model.fields.detail[payload.index]
  if (!section?.value) {
    return
  }

  section.value[payload.key] = payload.value
  saveToFM()
}

function moveExhibit(payload) {
  const target = payload.index + payload.direction
  if (target < 0 || target >= model.exhibits.length) {
    return
  }

  const current = model.exhibits[payload.index]
  model.exhibits[payload.index] = model.exhibits[target]
  model.exhibits[target] = current
  saveToFM()
}

function removeExhibit(payload) {
  model.exhibits.splice(payload.index, 1)
  saveToFM()
}

function updateExhibitTitle(payload) {
  const exhibit = model.exhibits[payload.index]
  if (!exhibit?.title) {
    return
  }

  exhibit.title[payload.key] = payload.value
  saveToFM()
}

function updateExhibitDescription(payload) {
  const exhibit = model.exhibits[payload.index]
  if (!exhibit?.description) {
    return
  }

  exhibit.description[payload.key] = payload.value
  saveToFM()
}

function updateExhibitImage(payload) {
  const exhibit = model.exhibits[payload.index]
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
  () => model.bilingual,
  () => {
    saveToFM()
  },
)

onSetup(() => {
  normalizeModelData()
  getImagesList()
})

onMounted(() => {
  exposeToFileMaker('getAsHtml', getAsHtml)
  exposeToFileMaker('insertImagesList', insertImagesList)
  exposeToFileMaker('insertSignature', insertSignature)
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
          <input v-model="model.bilingual" type="checkbox" class="rounded border-slate-300">
          Bilingual
        </label>
      </template>

      <button type="button" class="toolbar-button" @click="getAsHtml">Save PDF</button>
      <button type="button" class="toolbar-button" @click="togglePageSize">{{ model.pageSize || 'Letter' }}</button>
      <button v-if="!isFinal" type="button" class="toolbar-button" @click="finalize">Finalize</button>
      <span class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{{ statusLabel }}</span>
    </div>

    <main class="px-4 pb-10 pt-24">
      <section id="page" class="mx-auto w-full max-w-204 bg-white px-8 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
        <span id="filename" class="hidden">
          {{ model.status === 'final' ? '' : 'DRAFT ' }}{{ currentReportType.name.en }} {{ model.fields.fileNumber.bi }}{{ model.fields.meetingDate.en ? ` ${model.fields.meetingDate.en}` : '' }}
        </span>
        <span id="pageSize" class="hidden">{{ model.pageSize || 'Letter' }}</span>
        <span id="attachments" class="hidden">{{ model.attachments }}</span>

        <header class="report-header">
          <div class="w-120" v-html="headerSvgMarkup" />
          <div class="text-right text-[16px] text-slate-600">
            <span class="pageNumber" /> / <span class="totalPages" />
          </div>
        </header>

        <div class="mb-5 mt-4 grid gap-4" :class="bilingual ? 'grid-cols-2' : 'grid-cols-1'">
          <h1 v-if="currentLanguage === 'en'" class="text-2xl font-bold tracking-tight text-slate-900">
            {{ currentReportType.name.en }}
          </h1>
          <h1 v-if="currentLanguage === 'fr' || bilingual" class="text-2xl font-bold tracking-tight text-slate-900">
            {{ currentReportType.name.fr }}
          </h1>
          <h1 v-if="currentLanguage === 'fr' && bilingual" class="text-2xl font-bold tracking-tight text-slate-900">
            {{ currentReportType.name.en }}
          </h1>
        </div>

        <div
          class="mb-5 grid gap-4 text-sm"
          :class="bilingual ? 'grid-cols-2' : 'grid-cols-1'"
          v-html="chooseTranslation(`<h2><strong class='text-[11px] uppercase tracking-[0.12em] text-slate-500'>To:</strong> ${model.to.en}</h2>`, `<h2><strong class='text-[11px] uppercase tracking-[0.12em] text-slate-500'>A :</strong> ${model.to.fr}</h2>`)"
        />

        <SmallFieldTwoColumn
          labelen="Subject"
          labelfr="Objet"
          :text="model.fields.subject"
          :language="currentLanguage"
          :bilingual="bilingual"
          :disabled="isFinal"
          editable
          @update-field="(payload) => updateFieldValue(model.fields.subject, payload)"
          @editing-change="handleEditingChange"
        />
        <SmallFieldTwoColumn
          labelen="Meeting Date"
          labelfr="Date de la reunion"
          :text="model.fields.meetingDate"
          :language="currentLanguage"
          :bilingual="bilingual"
          :disabled="isFinal"
          editable
          @update-field="(payload) => updateFieldValue(model.fields.meetingDate, payload)"
          @editing-change="handleEditingChange"
        />
        <SmallFieldTwoColumn
          v-if="model.type === 'prac'"
          labelen="Agenda Item"
          labelfr="Point a l'ordre du jour"
          :text="model.fields.agendaItem"
          :language="currentLanguage"
          :bilingual="bilingual"
          :disabled="isFinal"
          editable
          @update-field="(payload) => updateFieldValue(model.fields.agendaItem, payload)"
          @editing-change="handleEditingChange"
        />
        <SmallFieldTwoColumn
          labelen="File Number"
          labelfr="Numero du fichier"
          :text="model.fields.fileNumber"
          :language="currentLanguage"
          :bilingual="bilingual"
          :disabled="isFinal"
          @update-field="(payload) => updateFieldValue(model.fields.fileNumber, payload)"
          @editing-change="handleEditingChange"
        />

        <div class="my-8 grid grid-cols-2 gap-6 text-sm">
          <ReportSignature
            v-for="signature in model.signatures"
            :key="signature.id_Role"
            :signature="signature"
            :disabled="isFinal"
            :choose-translation="chooseTranslation"
            @remove="removeSignature(signature)"
            @sign="requestSignature(signature)"
          />
        </div>

        <section v-if="model.property" class="mb-4 grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
          <div>
            <h2 class="mb-2 text-lg font-semibold text-slate-900">
              {{ chooseTranslation('General Information', 'Information generale', ' / ') }}
            </h2>

            <div class="space-y-4 text-sm">
              <div>
                <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {{ chooseTranslation('Applicant', 'Requerant', ' / ') }}
                </h3>
                <p>{{ model.fields.applicant }}</p>
              </div>
              <div>
                <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {{ chooseTranslation('Landowner', 'Proprietaire', ' / ') }}
                </h3>
                <p>{{ model.fields.landowner }}</p>
              </div>

              <MarkdownBilingual
                labelen="Proposal"
                labelfr="Demande"
                :text="model.fields.proposal"
                :language="currentLanguage"
                :bilingual="bilingual"
                :disabled="isFinal"
                stacked
                @update-field="(payload) => updateFieldValue(model.fields.proposal, payload)"
                @editing-change="handleEditingChange"
              />
            </div>
          </div>

          <div class="mr-1 flex h-fit flex-col items-center justify-start border border-black">
            <div class="flex h-[9cm] w-[9cm] shrink-0 items-center justify-center border-b">
              <LibraryImage
                :image="model.images.propertyLocation"
                :image-library="imageLibrary"
                :disabled="isFinal"
                @save="saveToFM"
                @update:image="updatePropertyLocationImage"
              />
            </div>

            <div id="belowMap" class="m-2 flex items-center gap-4">
              <div id="captionAndLegend" class="pl-4">
                <span class="font-bold">Property Location Map</span>
                <div class="flex items-center justify-center gap-2">
                  <input
                    type="color"
                    :value="model.legendColor || DEFAULT_LEGEND_COLOR"
                    :disabled="isFinal"
                    class="legend-color-chip"
                    @input="updateLegendColor"
                  />
                  <span>Subject Property</span>
                </div>
              </div>

              <div id="icon">
                <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    d="M42.066 0v20h3.752V6.957L53.881 20h4.053V0h-3.752v13.355L45.996 0zm5.57 26.688l-25.77 69.949c-.823 2.238 1.658 4.248 3.677 2.978L50 84.195l24.455 15.42c2.02 1.273 4.504-.738 3.68-2.978l-25.79-70c-.472-1.096-1.283-1.632-2.384-1.635c-1.1-.003-2.017.856-2.324 1.686zm-.136 14.83V79.86L29.1 91.463z"
                    fill="#000"
                    fill-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section v-if="model.property">
          <h2 class="mb-2 text-lg font-semibold text-slate-900">
            {{ chooseTranslation('Site Information', 'Information du site', ' / ') }}
          </h2>

          <SmallFieldTwoColumn
            labelen="PID"
            labelfr="NID"
            :text="model.fields.pid"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            @update-field="(payload) => updateFieldValue(model.fields.pid, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Lot Size"
            labelfr="Grandeur du lot"
            :text="model.fields.lotSize"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.lotSize, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Location"
            labelfr="Endroit"
            :text="model.fields.location"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.location, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Municipality"
            labelfr="Municipalite"
            :text="model.fields.municipality"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            @update-field="(payload) => updateFieldValue(model.fields.municipality, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Zoning"
            labelfr="Zonage"
            :text="model.fields.zoning"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.zoning, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Future Land Use Designation"
            labelfr="Designation de l'utilisation future du sol"
            :text="model.fields.futureUse"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.futureUse, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Current Use"
            labelfr="Usage present"
            :text="model.fields.currentUse"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.currentUse, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Surrounding Use"
            labelfr="Usage des environs"
            :text="model.fields.surroundingUse"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.surroundingUse, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Municipal Services"
            labelfr="Services municipaux"
            :text="model.fields.municipalServices"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.municipalServices, payload)"
            @editing-change="handleEditingChange"
          />
          <SmallFieldTwoColumn
            labelen="Access/egress"
            labelfr="Acces-Sortie"
            :text="model.fields.access"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            editable
            @update-field="(payload) => updateFieldValue(model.fields.access, payload)"
            @editing-change="handleEditingChange"
          />
        </section>

        <BodySections
          :sections="model.fields.detail"
          :language="currentLanguage"
          :bilingual="bilingual"
          :disabled="isFinal"
          @update-section-field="updateSectionField"
          @editing-change="handleEditingChange"
        />

        <div
          v-if="bilingual"
          class="mt-5 flex gap-6 text-xs break-inside-avoid"
          :class="currentLanguage === 'fr' ? 'flex-row-reverse' : 'flex-row'"
        >
          <p class="flex-1">
            <strong>Note:</strong> This report was written in {{ currentLanguage === 'en' ? 'English' : 'French' }} and translated to {{ currentLanguage === 'en' ? 'French' : 'English' }}. Where a conflict exists between the two languages, the original language shall prevail.
          </p>
          <p class="flex-1">
            <strong>Note:</strong> ce rapport a ete redige en {{ currentLanguage === 'en' ? 'anglais' : 'francais' }} et traduit en {{ currentLanguage === 'en' ? 'francais' : 'anglais' }}. En cas de conflit entre les deux langues, la langue originale prevaudra.
          </p>
        </div>

        <ExhibitsList
          :exhibits="model.exhibits"
          :language="currentLanguage"
          :bilingual="bilingual"
          :image-library="imageLibrary"
          :disabled="isFinal"
          @move-exhibit="moveExhibit"
          @remove-exhibit="removeExhibit"
          @update-exhibit-title="updateExhibitTitle"
          @update-exhibit-description="updateExhibitDescription"
          @update-exhibit-image="updateExhibitImage"
          @editing-change="handleEditingChange"
        />

        <div v-if="!isFinal" class="no-print mb-6 mt-6">
          <h2 class="text-lg font-semibold">Add an exhibit...</h2>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <select
              v-model="selectedExhibit"
              class="min-w-56 rounded border border-slate-300 bg-white px-3 py-2"
            >
              <option disabled value="">Select...</option>
              <option v-for="type in exhibitTypes" :key="type.en" :value="type">
                {{ chooseTranslation(type.en, type.fr, ' / ') }}
              </option>
              <option :value="{ en: 'Other', fr: 'Autre' }">{{ chooseTranslation('Other', 'Autre', ' / ') }}</option>
            </select>

            <button type="button" class="rounded bg-slate-700 px-3 py-2 text-sm text-white" @click="addExhibit">
              Add
            </button>
          </div>
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
