<!--
  AssetResultCard — Renders asset-type skill outputs (images, files, markdown).

  When result_surface.resultKind === 'asset', use this component
  to render file-based outputs with type-specific previews.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, Maximize2, Image, FileText, File } from 'lucide-vue-next'
import MarkdownRenderer from './MarkdownRenderer.vue'

export interface AssetMeta {
  assetType: 'image' | 'file' | 'markdown'
  fileName?: string
  fileSize?: number
  fileUrl?: string
}

const props = defineProps<{
  content: string
  assetMeta?: AssetMeta
}>()

const imageExpanded = ref(false)
const imageLoaded = ref(false)
const imageError = ref(false)

const assetType = computed(() => props.assetMeta?.assetType ?? 'file')
const fileName = computed(() => props.assetMeta?.fileName ?? 'asset')
const fileSize = computed(() => {
  const bytes = props.assetMeta?.fileSize
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const typeIcon = computed(() => {
  switch (assetType.value) {
    case 'image': return Image
    case 'markdown': return FileText
    default: return File
  }
})

const typeLabel = computed(() => {
  switch (assetType.value) {
    case 'image': return 'Image'
    case 'markdown': return 'Document'
    default: return 'File'
  }
})

function handleDownload() {
  const url = props.assetMeta?.fileUrl
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value
  a.click()
}
</script>

<template>
  <div class="result-surface-card result-surface-card--asset">
    <div class="result-surface-card__header">
      <component :is="typeIcon" :size="14" class="result-surface-card__type-icon" />
      <span class="result-surface-card__label">{{ typeLabel }}</span>
      <span class="result-surface-card__filename">{{ fileName }}</span>
      <span v-if="fileSize" class="result-surface-card__filesize">{{ fileSize }}</span>
      <button
        v-if="assetMeta?.fileUrl"
        class="result-surface-card__action-btn"
        :aria-label="`Download ${fileName}`"
        @click.stop="handleDownload"
      >
        <Download :size="13" />
      </button>
    </div>
    <div class="result-surface-card__divider" />

    <!-- Image preview -->
    <div v-if="assetType === 'image' && assetMeta?.fileUrl" class="result-surface-card__body result-surface-card__body--image">
      <!-- Loading state -->
      <div v-if="!imageLoaded && !imageError" class="result-surface-card__image-loading">
        <div class="result-surface-card__image-spinner" />
        <span>Loading...</span>
      </div>
      <!-- Error state -->
      <div v-else-if="imageError" class="result-surface-card__image-error">
        <Image :size="24" />
        <span>Failed to load image</span>
      </div>
      <!-- Image with overlay expand button -->
      <div v-else class="result-surface-card__image-wrapper">
        <img
          :src="assetMeta.fileUrl"
          :alt="`Preview of ${fileName}`"
          class="result-surface-card__image"
          :class="{ 'result-surface-card__image--expanded': imageExpanded }"
          @click.stop="imageExpanded = !imageExpanded"
          @load="imageLoaded = true"
          @error="imageError = true"
        />
        <button
          class="result-surface-card__expand-btn"
          :aria-label="imageExpanded ? 'Collapse image' : 'Expand image'"
          :aria-expanded="imageExpanded"
          @click.stop="imageExpanded = !imageExpanded"
        >
          <Maximize2 :size="12" />
          {{ imageExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>
    </div>

    <!-- Markdown preview -->
    <div v-else-if="assetType === 'markdown'" class="result-surface-card__body">
      <MarkdownRenderer :content="content" />
    </div>

    <!-- File fallback: show content as text -->
    <div v-else class="result-surface-card__body result-surface-card__body--file">
      <pre v-if="content" class="result-surface-card__file-content">{{ content }}</pre>
      <span v-else class="result-surface-card__file-empty">No preview available</span>
    </div>
  </div>
</template>

<style scoped>
.result-surface-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 6px 0;
  border: 0.5px solid var(--hc-border);
  border-radius: var(--hc-radius-xl);
  background: var(--hc-bg-card);
  box-shadow: var(--hc-shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
  animation: rsc-enter 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.result-surface-card:hover {
  box-shadow: var(--hc-shadow-md);
  border-color: var(--hc-accent);
}
@keyframes rsc-enter {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header */
.result-surface-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--hc-bg-elevated);
  flex-wrap: wrap;
}
.result-surface-card__type-icon {
  flex-shrink: 0;
  color: var(--hc-text-muted);
}
.result-surface-card__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--hc-text-primary);
  letter-spacing: -0.01em;
}
.result-surface-card__filename {
  font-size: 12px;
  color: var(--hc-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.result-surface-card__filesize {
  font-size: 11px;
  color: var(--hc-text-muted);
  margin-left: auto;
}
.result-surface-card__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--hc-border);
  background: transparent;
  color: var(--hc-text-muted);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.result-surface-card__action-btn:hover {
  background: var(--hc-accent-subtle);
  border-color: var(--hc-accent);
  color: var(--hc-accent);
}

/* Divider */
.result-surface-card__divider {
  height: 1px;
  background: var(--hc-border);
}

/* Body */
.result-surface-card__body {
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--hc-text-primary);
}

/* Image */
.result-surface-card__body--image {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.result-surface-card__image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.result-surface-card__image {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--hc-radius-md);
  object-fit: contain;
  cursor: zoom-in;
  transition: max-height 0.3s ease;
}
.result-surface-card__image--expanded {
  max-height: 80vh;
  cursor: zoom-out;
}
.result-surface-card__expand-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 8px 12px;
  min-height: 36px;
  border-radius: 6px;
  border: 1px solid var(--hc-border);
  background: var(--hc-bg-elevated);
  color: var(--hc-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
  box-shadow: var(--hc-shadow-sm);
}
.result-surface-card__image-wrapper:hover .result-surface-card__expand-btn,
.result-surface-card__image-wrapper .result-surface-card__expand-btn:focus-visible {
  opacity: 1;
}
.result-surface-card__expand-btn:hover {
  background: var(--hc-accent-subtle);
  border-color: var(--hc-accent);
  color: var(--hc-accent);
}

/* Image loading */
.result-surface-card__image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  font-size: 12px;
  color: var(--hc-text-muted);
}
.result-surface-card__image-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--hc-border);
  border-top-color: var(--hc-accent);
  border-radius: 50%;
  animation: rsc-spin 0.6s linear infinite;
}
@keyframes rsc-spin {
  to { transform: rotate(360deg); }
}

/* Image error */
.result-surface-card__image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 0;
  font-size: 12px;
  color: var(--hc-text-muted);
}
.result-surface-card__image-error svg {
  opacity: 0.4;
}

/* File */
.result-surface-card__body--file {
  padding: 12px 16px;
}
.result-surface-card__file-content {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--hc-text-muted);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
.result-surface-card__file-empty {
  font-size: 13px;
  color: var(--hc-text-muted);
  font-style: italic;
}

/* Focus visible — keyboard accessibility */
.result-surface-card__action-btn:focus-visible,
.result-surface-card__expand-btn:focus-visible {
  outline: 2px solid var(--hc-accent);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .result-surface-card {
    animation: none;
  }
  .result-surface-card__image {
    transition: none;
  }
  .result-surface-card__expand-btn {
    transition: none;
  }
  .result-surface-card__image-spinner {
    animation: none;
  }
}

/* Touch devices — expand button always visible, larger targets */
@media (hover: none) and (pointer: coarse) {
  .result-surface-card__image-wrapper .result-surface-card__expand-btn {
    opacity: 1;
  }
  .result-surface-card__image {
    max-height: 240px;
  }
}

/* Narrow screens */
@media (max-width: 400px) {
  .result-surface-card__header {
    gap: 6px;
    padding: 8px 12px;
  }
  .result-surface-card__filename {
    max-width: 120px;
  }
  .result-surface-card__body {
    padding: 12px;
  }
  .result-surface-card__image {
    max-height: 200px;
  }
}
</style>
