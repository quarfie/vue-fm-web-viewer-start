<script setup>
import 'easymde/dist/easymde.min.css'

import EasyMDE from 'easymde'
import showdown from 'showdown'
import { nextTick, onBeforeUnmount, ref } from 'vue'
import IconBold from '~icons/material-symbols/format-bold'
import IconItalic from '~icons/material-symbols/format-italic'
import IconStrikethrough from '~icons/material-symbols/strikethrough-s'
import IconBulletList from '~icons/material-symbols/format-list-bulleted'
import IconNumberList from '~icons/material-symbols/format-list-numbered'
import IconQuote from '~icons/material-symbols/format-quote'
import IconTable from '~icons/material-symbols/table-chart'

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '[add text]',
  },
})

const emit = defineEmits(['update:text', 'editing-change'])

const converter = new showdown.Converter({
  strikethrough: true,
  tables: true,
  simpleLineBreaks: true,
})

const isEditing = ref(false)
const editorRef = ref(null)
let editor = null

const toolbarButtons = [
  {
    name: 'bold',
    title: 'Bold',
    icon: IconBold,
    action: () => EasyMDE.toggleBold(editor),
  },
  {
    name: 'italic',
    title: 'Italic',
    icon: IconItalic,
    action: () => EasyMDE.toggleItalic(editor),
  },
  {
    name: 'strikethrough',
    title: 'Strikethrough',
    icon: IconStrikethrough,
    action: () => EasyMDE.toggleStrikethrough(editor),
  },
  {
    name: 'unordered-list',
    title: 'Bullet List',
    icon: IconBulletList,
    action: () => EasyMDE.toggleUnorderedList(editor),
  },
  {
    name: 'ordered-list',
    title: 'Numbered List',
    icon: IconNumberList,
    action: () => EasyMDE.toggleOrderedList(editor),
  },
  {
    name: 'quote',
    title: 'Quote',
    icon: IconQuote,
    action: () => EasyMDE.toggleBlockquote(editor),
  },
  {
    name: 'table',
    title: 'Table',
    icon: IconTable,
    action: () => EasyMDE.drawTable(editor),
  },
]

function destroyEditor() {
  if (!editor) {
    return
  }

  editor.toTextArea()
  editor = null
}

async function startEditing() {
  if (props.disabled || isEditing.value) {
    return
  }

  isEditing.value = true
  emit('editing-change', true)
  await nextTick()

  editor = new EasyMDE({
    element: editorRef.value,
    autofocus: true,
    initialValue: props.text,
    spellChecker: false,
    status: false,
    toolbar: false,
  })

  editor.codemirror.on('keydown', (_, event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      stopEditing(false)
    }
  })
}

function runToolbarAction(action) {
  if (!editor) {
    return
  }

  action()
  editor.codemirror.focus()
}

function stopEditing(save) {
  if (!isEditing.value) {
    return
  }

  const nextValue = editor?.value() ?? props.text

  destroyEditor()
  isEditing.value = false
  emit('editing-change', false)

  if (save && nextValue !== props.text) {
    emit('update:text', nextValue)
  }
}

function renderMarkdown(value) {
  return converter.makeHtml(value ?? '')
}

onBeforeUnmount(() => {
  if (isEditing.value) {
    emit('editing-change', false)
  }
  destroyEditor()
})
</script>

<template>
  <div>
    <p
      v-if="label"
      class="mb-2 text-lg font-semibold text-slate-900"
      @click="startEditing"
    >
      {{ label }}
    </p>

    <button
      v-if="!label && !text && !isEditing"
      type="button"
      class="text-sm text-slate-500 transition hover:text-sky-700"
      :disabled="disabled"
      @click="startEditing"
    >
      {{ placeholder }}
    </button>

    <div v-if="!isEditing" class="report-markdown text-sm" @click="startEditing" v-html="renderMarkdown(text)" />
    <div v-else>
      <div class="mb-2 flex flex-wrap items-center gap-1 rounded border border-slate-300 bg-slate-50 p-1">
        <button
          v-for="button in toolbarButtons"
          :key="button.name"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 transition hover:bg-slate-200"
          :title="button.title"
          @click="runToolbarAction(button.action)"
        >
          <component :is="button.icon" class="text-lg" />
        </button>

        <div class="mx-1 h-6 w-px bg-slate-300" />

        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded text-emerald-700 transition hover:bg-emerald-100"
          title="Save and close editor"
          @click="stopEditing(true)"
        >
          <i-material-symbols-check class="text-lg" />
        </button>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded text-rose-700 transition hover:bg-rose-100"
          title="Cancel and close editor"
          @click="stopEditing(false)"
        >
          <i-material-symbols-close class="text-lg" />
        </button>
      </div>

      <textarea ref="editorRef" class="w-full rounded border border-slate-300 bg-white" />
    </div>
  </div>
</template>
