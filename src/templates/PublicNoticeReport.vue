<script setup>
import { computed, ref } from 'vue'

import ExhibitsList from '@/components/ExhibitsList.vue'
import LangBlock from '@/components/LangBlock.vue'
import ReportSignature from '@/components/ReportSignature.vue'
import { exhibitTypes } from '@/constants'

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

const emit = defineEmits([
  'move-exhibit',
  'remove-exhibit',
  'update-exhibit-title',
  'update-exhibit-description',
  'update-exhibit-image',
  'remove-signature',
  'request-signature',
  'add-exhibit',
  'save-to-fm',
  'editing-change',
])

const fields = computed(() => props.model.content?.fields ?? {})
const municipality = computed(() => props.model.content?.data?.municipality ?? {})
const reviewCommittee = computed(() => municipality.value.reviewCommittee ?? {})
const meeting = computed(() => reviewCommittee.value.meeting ?? {})

function chooseTranslation(en, fr, delimiter = ' / ') {
  const primary = props.currentLanguage === 'en' ? en : fr
  const secondary = props.currentLanguage === 'en' ? fr : en
  return `${primary}${props.bilingual ? delimiter : ''}${props.bilingual ? secondary : ''}`
}

function monthName(month, language) {
  const en = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const fr = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ]

  const index = Number(month) - 1
  if (index < 0 || index > 11) {
    return ''
  }

  return language === 'fr' ? fr[index] : en[index]
}

function dayOfWeek(dateParts, language) {
  const day = Number(dateParts?.day)
  const month = Number(dateParts?.month)
  const year = Number(dateParts?.year)
  if (!day || !month || !year) {
    return ''
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', timeZone: 'UTC' }).format(date)
}

function timeLabel(timeParts, language) {
  const hour = Number(timeParts?.hour)
  const minute = Number(timeParts?.minute)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return ''
  }

  if (language === 'fr') {
    return `${String(hour).padStart(2, '0')} h ${String(minute).padStart(2, '0')}`
  }

  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
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
  <div class="space-y-4 text-sm">
    <LangBlock :language="currentLanguage" :bilingual="bilingual" custom-class="mt-3">
      <template #en>
        <p>{{ monthName(fields.date?.month, 'en') }} {{ fields.date?.day }}, {{ fields.date?.year }}</p>
      </template>
      <template #fr>
        <p>{{ fields.date?.day }} {{ monthName(fields.date?.month, 'fr') }}, {{ fields.date?.year }}</p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual" custom-class="mb-5 mt-2">
      <template #en>
        <h1 class="text-center text-2xl font-bold uppercase">Public Notice</h1>
      </template>
      <template #fr>
        <h1 class="text-center text-2xl font-bold uppercase">Avis public</h1>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>
          RE: {{ fields.subject?.en }}, {{ fields.applicant }}, {{ fields.location?.en }}, {{ municipality.name?.en }}
          (PID {{ fields.pid?.bi }})
          <span class="font-bold">{{ fields.description?.en }}</span>.
          (File Number {{ fields.fileNumber?.bi }})
        </p>
      </template>
      <template #fr>
        <p>
          Objet: {{ fields.subject?.fr }}, {{ fields.applicant }}, {{ fields.location?.fr }}, {{ municipality.name?.fr }}
          (NID {{ fields.pid?.bi }})
          <span class="font-bold">{{ fields.description?.fr }}</span>.
          (numero de filiere {{ fields.fileNumber?.bi }})
        </p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>
          As a property owner within <span class="font-bold">{{ fields.distanceMetres }} metres</span> of the above noted application,
          this notice has been sent to you to seek any comments you would like to offer.
        </p>
      </template>
      <template #fr>
        <p>
          En tant que proprietaire a moins de <span class="font-bold">{{ fields.distanceMetres }} metres</span> de la demande susmentionnee,
          cet avis vous a ete envoye afin de solliciter tous les commentaires que vous souhaitez faire.
        </p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>
          The {{ reviewCommittee.name?.en }} will consider the above noted application on
          <span class="font-bold">{{ dayOfWeek(fields.meetingDate, 'en') }}, {{ monthName(fields.meetingDate?.month, 'en') }} {{ fields.meetingDate?.day }}, {{ fields.meetingDate?.year }}</span>.
          The meeting will be held at the {{ meeting.location?.en }} located at {{ meeting.address?.en }} and begin at {{ timeLabel(meeting.time, 'en') }}.
        </p>
      </template>
      <template #fr>
        <p>
          Le {{ reviewCommittee.name?.fr }} examinera la demande susmentionnee le
          <span class="font-bold">{{ dayOfWeek(fields.meetingDate, 'fr') }} {{ fields.meetingDate?.day }} {{ monthName(fields.meetingDate?.month, 'fr') }}, {{ fields.meetingDate?.year }}</span>.
          La reunion aura lieu au {{ meeting.location?.fr }} situe a {{ meeting.address?.fr }} a {{ timeLabel(meeting.time, 'fr') }}.
        </p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>
          You can make your comments known to the Committee by sending comments in writing to me. All written comments must be signed or display the author's name, civic address and phone number. Once received they are considered public documents and may be posted on our website as part of the staff report. Written comments will be read at the meeting if you are unable to participate.
        </p>
      </template>
      <template #fr>
        <p>
          Vous pouvez faire connaitre vos commentaires au Comite en m'envoyant vos commentaires par ecrit. Tous les commentaires ecrits doivent etre signes ou doivent afficher le nom, l'adresse et le numero de telephone de l'auteur. Une fois recus, vos commentaires sont consideres des documents publics et peuvent etre affiches sur notre site web dans le cadre du rapport du personnel. Les commentaires seront lus lors de la reunion si vous ne pouvez pas participer.
        </p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>
          A staff report detailing the specifics of the request may be viewed on our website the Wednesday before the meeting at
          <a class="text-sky-700 underline" :href="meeting.noticeUrl?.en" target="_blank" rel="noreferrer">{{ meeting.noticeUrl?.en }}</a>.
          Any changes to the meeting location or public participation requirements prior to the meeting will be posted here.
        </p>
      </template>
      <template #fr>
        <p>
          Un rapport du personnel precisant les details de la demande peut etre consulte sur notre site web le mercredi avant la reunion a
          <a class="text-sky-700 underline" :href="meeting.noticeUrl?.fr" target="_blank" rel="noreferrer">{{ meeting.noticeUrl?.fr }}</a>.
          S'il y a des modifications a l'adresse du site internet pour la participation du public avant la reunion, elles seront publiees ici.
        </p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>If you require further information, or would like to discuss this matter further, please do not hesitate to contact me.</p>
      </template>
      <template #fr>
        <p>Si vous avez besoin de plus d'informations ou si vous souhaitez discuter ce sujet davantage, n'hesitez pas a me contacter.</p>
      </template>
    </LangBlock>

    <LangBlock :language="currentLanguage" :bilingual="bilingual">
      <template #en>
        <p>Sincerely,</p>
      </template>
      <template #fr>
        <p>Cordialement,</p>
      </template>
    </LangBlock>

    <div class="my-6 grid grid-cols-2 gap-6 text-sm">
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
      @save="emit('save-to-fm')"
      @editing-change="(value) => emit('editing-change', value)"
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
            {{ chooseTranslation(type.en, type.fr) }}
          </option>
          <option :value="{ en: 'Other', fr: 'Autre' }">{{ chooseTranslation('Other', 'Autre') }}</option>
        </select>

        <button type="button" class="rounded bg-slate-700 px-3 py-2 text-sm text-white" @click="addExhibit">
          Add
        </button>
      </div>
    </div>
  </div>
</template>
