<script setup>
import { computed, ref, toRefs } from 'vue'

import BodySections from '@/components/BodySections.vue'
import ExhibitsList from '@/components/ExhibitsList.vue'
import LibraryImage from '@/components/LibraryImage.vue'
import MarkdownBilingual from '@/components/MarkdownBilingual.vue'
import ReportSignature from '@/components/ReportSignature.vue'
import SmallFieldTwoColumn from '@/components/SmallFieldTwoColumn.vue'
import { exhibitTypes } from '@/constants'

const DEFAULT_LEGEND_COLOR = '#fdba74'

const reportTypes = [
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

const selectedExhibit = ref('')

const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
  currentLanguage: {
    type: String,
    required: true,
  },
  bilingual: {
    type: Boolean,
    required: true,
  },
  isFinal: {
    type: Boolean,
    required: true,
  },
  imageLibrary: {
    type: Array,
    required: true,
  },
})

const { model, currentLanguage, bilingual, isFinal, imageLibrary } = toRefs(props)

const currentReportType = computed(() => {
  const currentType = model.value?.template?.options?.type
  return reportTypes.find((reportType) => reportType.type === currentType) ?? reportTypes[0]
})

const emit = defineEmits([
  'update-field-value',
  'update-section-field',
  'move-exhibit',
  'remove-exhibit',
  'update-exhibit-title',
  'update-exhibit-description',
  'update-exhibit-image',
  'remove-signature',
  'request-signature',
  'add-exhibit',
  'save-to-fm',
  'update-property-location-image',
  'update-legend-color',
  'editing-change',
])

function chooseTranslation(en, fr, delimiter = '') {
  const primary = currentLanguage.value === 'en' ? en : fr
  const secondary = currentLanguage.value === 'en' ? fr : en
  return `${primary}${bilingual.value ? delimiter : ''}${bilingual.value ? secondary : ''}`
}

function handleEditingChange(isEditing) {
  emit('editing-change', isEditing)
}

function addExhibit() {
  if (!selectedExhibit.value) {
    return
  }

  emit('add-exhibit', selectedExhibit.value)
  selectedExhibit.value = ''
}
</script>

<template>
  <div>
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
      v-html="chooseTranslation(`<h2><strong class='text-[11px] uppercase tracking-[0.12em] text-slate-500'>To:</strong> ${model.content.fields.to?.en ?? ''}</h2>`, `<h2><strong class='text-[11px] uppercase tracking-[0.12em] text-slate-500'>A :</strong> ${model.content.fields.to?.fr ?? ''}</h2>`)"
    />

    <SmallFieldTwoColumn
      labelen="Subject"
      labelfr="Objet"
      :text="model.content.fields.subject"
      :language="currentLanguage"
      :bilingual="bilingual"
      :disabled="isFinal"
      editable
      @update-field="(payload) => emit('update-field-value', 'subject', payload)"
      @editing-change="handleEditingChange"
    />
    <SmallFieldTwoColumn
      labelen="Meeting Date"
      labelfr="Date de la reunion"
      :text="model.content.fields.meetingDate"
      :language="currentLanguage"
      :bilingual="bilingual"
      :disabled="isFinal"
      editable
      @update-field="(payload) => emit('update-field-value', 'meetingDate', payload)"
      @editing-change="handleEditingChange"
    />
    <SmallFieldTwoColumn
      v-if="model.template.options.type === 'prac'"
      labelen="Agenda Item"
      labelfr="Point a l'ordre du jour"
      :text="model.content.fields.agendaItem"
      :language="currentLanguage"
      :bilingual="bilingual"
      :disabled="isFinal"
      editable
      @update-field="(payload) => emit('update-field-value', 'agendaItem', payload)"
      @editing-change="handleEditingChange"
    />
    <SmallFieldTwoColumn
      labelen="File Number"
      labelfr="Numero du fichier"
      :text="model.content.fields.fileNumber"
      :language="currentLanguage"
      :bilingual="bilingual"
      :disabled="isFinal"
      @update-field="(payload) => emit('update-field-value', 'fileNumber', payload)"
      @editing-change="handleEditingChange"
    />

    <div class="my-8 grid grid-cols-2 gap-6 text-sm">
      <ReportSignature
        v-for="signature in model.content.signatures"
        :key="signature.id_Role"
        :signature="signature"
        :disabled="isFinal"
        :choose-translation="chooseTranslation"
        @remove="emit('remove-signature', signature)"
        @sign="emit('request-signature', signature)"
      />
    </div>

    <section v-if="model.template.options.property" class="mb-4 grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
      <div>
        <h2 class="mb-2 text-lg font-semibold text-slate-900">
          {{ chooseTranslation('General Information', 'Information generale', ' / ') }}
        </h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {{ chooseTranslation('Applicant', 'Requerant', ' / ') }}
            </h3>
            <p>{{ model.content.fields.applicant }}</p>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {{ chooseTranslation('Landowner', 'Proprietaire', ' / ') }}
            </h3>
            <p>{{ model.content.fields.landowner }}</p>
          </div>

          <MarkdownBilingual
            labelen="Proposal"
            labelfr="Demande"
            :text="model.content.fields.proposal"
            :language="currentLanguage"
            :bilingual="bilingual"
            :disabled="isFinal"
            stacked
            @update-field="(payload) => emit('update-field-value', 'proposal', payload)"
            @editing-change="handleEditingChange"
          />
        </div>
      </div>

      <div class="mr-1 flex h-fit flex-col items-center justify-start border border-black">
        <div class="flex h-[9cm] w-[9cm] shrink-0 items-center justify-center border-b">
          <LibraryImage
            :image="model.content.images.propertyLocation.image"
            :image-library="imageLibrary"
            :disabled="isFinal"
            @save="emit('save-to-fm')"
            @update:image="(value) => emit('update-property-location-image', value)"
          />
        </div>

        <div id="belowMap" class="m-2 flex items-center gap-4">
          <div id="captionAndLegend" class="pl-4">
            <span class="font-bold">Property Location Map</span>
            <div class="flex items-center justify-center gap-2">
              <input
                type="color"
                :value="model.content.images.propertyLocation.data.legendColor || DEFAULT_LEGEND_COLOR"
                :disabled="isFinal"
                class="legend-color-chip"
                @input="(e) => emit('update-legend-color', e)"
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

    <section v-if="model.template.options.property">
      <h2 class="mb-2 text-lg font-semibold text-slate-900">
        {{ chooseTranslation('Site Information', 'Information du site', ' / ') }}
      </h2>

      <SmallFieldTwoColumn
        labelen="PID"
        labelfr="NID"
        :text="model.content.fields.pid"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        @update-field="(payload) => emit('update-field-value', 'pid', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Lot Size"
        labelfr="Grandeur du lot"
        :text="model.content.fields.lotSize"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'lotSize', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Location"
        labelfr="Endroit"
        :text="model.content.fields.location"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'location', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Municipality"
        labelfr="Municipalite"
        :text="model.content.fields.municipality"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        @update-field="(payload) => emit('update-field-value', 'municipality', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Zoning"
        labelfr="Zonage"
        :text="model.content.fields.zoning"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'zoning', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Future Land Use Designation"
        labelfr="Designation de l'utilisation future du sol"
        :text="model.content.fields.futureUse"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'futureUse', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Current Use"
        labelfr="Usage present"
        :text="model.content.fields.currentUse"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'currentUse', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Surrounding Use"
        labelfr="Usage des environs"
        :text="model.content.fields.surroundingUse"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'surroundingUse', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Municipal Services"
        labelfr="Services municipaux"
        :text="model.content.fields.municipalServices"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'municipalServices', payload)"
        @editing-change="handleEditingChange"
      />
      <SmallFieldTwoColumn
        labelen="Access/egress"
        labelfr="Acces-Sortie"
        :text="model.content.fields.access"
        :language="currentLanguage"
        :bilingual="bilingual"
        :disabled="isFinal"
        editable
        @update-field="(payload) => emit('update-field-value', 'access', payload)"
        @editing-change="handleEditingChange"
      />
    </section>

    <BodySections
      :sections="model.content.detail"
      :language="currentLanguage"
      :bilingual="bilingual"
      :disabled="isFinal"
      @update-section-field="(payload) => emit('update-section-field', payload)"
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
      :exhibits="model.content.exhibits"
      :language="currentLanguage"
      :bilingual="bilingual"
      :image-library="imageLibrary"
      :disabled="isFinal"
      @move-exhibit="(payload) => emit('move-exhibit', payload)"
      @remove-exhibit="(payload) => emit('remove-exhibit', payload)"
      @update-exhibit-title="(payload) => emit('update-exhibit-title', payload)"
      @update-exhibit-description="(payload) => emit('update-exhibit-description', payload)"
      @update-exhibit-image="(payload) => emit('update-exhibit-image', payload)"
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
  </div>
</template>

<style scoped>
#page {
  font-family: 'Avenir Next', 'Helvetica Neue', sans-serif;
}

:deep(.report-markdown ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
}

:deep(.report-markdown ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
}
</style>
