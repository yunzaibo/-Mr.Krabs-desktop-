<!--
  MarkdownEditor — Split-pane editor with live preview.
  Uses textarea (MVP) with marked for rendering. CodeMirror 6 can be added later.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { X, Columns, Eye, Pencil } from 'lucide-vue-next'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{
  assetId: string
  initialContent: string
  fileName: string
}>()

const emit = defineEmits<{
  save: [content: string]
  close: []
}>()

type ViewMode = 'split' | 'edit' | 'preview'

const content = ref(props.initialContent)
const viewMode = ref<ViewMode>('split')
const isSaved = ref(false)
const renderedMarkdown = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function updatePreview() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const raw = marked.parse(content.value) as string
    renderedMarkdown.value = DOMPurify.sanitize(raw)
  }, 150)
}

// Initial render
updatePreview()

watch(content, () => updatePreview(), { immediate: false })

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    emit('save', content.value)
    isSaved.value = true
    setTimeout(() => { isSaved.value = false }, 1500)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="markdown-editor" role="dialog" aria-label="Markdown editor">
    <!-- Header -->
    <div class="markdown-editor__header">
      <span class="markdown-editor__filename">{{ fileName }}</span>
      <div class="markdown-editor__status">
        <span v-if="isSaved" class="markdown-editor__saved">Saved</span>
      </div>
      <div class="markdown-editor__modes">
        <button
          data-testid="mode-split"
          class="hc-btn hc-btn-ghost"
          :class="{ 'hc-btn--active': viewMode === 'split' }"
          aria-label="Split view"
          @click="viewMode = 'split'"
        >
          <Columns :size="16" />
        </button>
        <button
          data-testid="mode-edit"
          class="hc-btn hc-btn-ghost"
          :class="{ 'hc-btn--active': viewMode === 'edit' }"
          aria-label="Edit only"
          @click="viewMode = 'edit'"
        >
          <Pencil :size="16" />
        </button>
        <button
          data-testid="mode-preview"
          class="hc-btn hc-btn-ghost"
          :class="{ 'hc-btn--active': viewMode === 'preview' }"
          aria-label="Preview only"
          @click="viewMode = 'preview'"
        >
          <Eye :size="16" />
        </button>
      </div>
      <button class="hc-btn hc-btn-ghost" aria-label="Close editor" @click="emit('close')">
        <X :size="18" />
      </button>
    </div>

    <!-- Editor body -->
    <div class="markdown-editor__body" :class="`markdown-editor__body--${viewMode}`">
      <!-- Editor pane -->
      <div v-if="viewMode !== 'preview'" class="markdown-editor__editor-pane">
        <textarea
          v-model="content"
          class="markdown-editor__textarea"
          aria-label="Markdown source"
          spellcheck="false"
        />
      </div>

      <!-- Preview pane -->
      <div v-if="viewMode !== 'edit'" class="markdown-editor__preview-pane">
        <div class="markdown-editor__preview-content" v-html="renderedMarkdown" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  border: 0.5px solid var(--hc-border);
  border-radius: var(--hc-radius-xl);
  background: var(--hc-bg-card);
  overflow: hidden;
  height: 100%;
}

.markdown-editor__header {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-3) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-border);
}

.markdown-editor__filename {
  font-size: 13px;
  font-weight: 500;
  color: var(--hc-text-primary);
}

.markdown-editor__status {
  flex: 1;
}

.markdown-editor__saved {
  font-size: 12px;
  color: var(--hc-success);
}

.markdown-editor__modes {
  display: flex;
  gap: var(--hc-space-1);
}

.hc-btn--active {
  background: var(--hc-bg-active);
  color: var(--hc-accent);
}

.markdown-editor__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.markdown-editor__body--split .markdown-editor__editor-pane,
.markdown-editor__body--split .markdown-editor__preview-pane {
  flex: 1;
}

.markdown-editor__body--edit .markdown-editor__editor-pane {
  flex: 1;
}

.markdown-editor__body--preview .markdown-editor__preview-pane {
  flex: 1;
}

.markdown-editor__editor-pane {
  border-right: 1px solid var(--hc-border);
}

.markdown-editor__textarea {
  width: 100%;
  height: 100%;
  padding: var(--hc-space-4);
  border: none;
  background: transparent;
  color: var(--hc-text-primary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.markdown-editor__preview-pane {
  overflow-y: auto;
}

.markdown-editor__preview-content {
  padding: var(--hc-space-4);
  color: var(--hc-text-primary);
  line-height: 1.6;
}

.markdown-editor button:focus-visible {
  outline: 2px solid var(--hc-accent);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .markdown-editor__body {
    flex-direction: column;
  }
  .markdown-editor__editor-pane {
    border-right: none;
    border-bottom: 1px solid var(--hc-border);
  }
}
</style>
