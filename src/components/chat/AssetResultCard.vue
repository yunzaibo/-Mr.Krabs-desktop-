<!--
  AssetResultCard — Renders asset-type skill outputs (images, files, markdown).

  When result_surface.resultKind === 'asset', use this component
  to render file-based outputs with type-specific previews.

  Pure presentational — emits events, no direct store/FS access.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { Download, Maximize2, Image, FileText, File, Pencil } from 'lucide-vue-next'
import type { AssetRenderDTO } from '@/types/asset'

const props = withDefaults(defineProps<{
  asset: AssetRenderDTO
  showVersionBadge?: boolean
  thumbnailMaxHeight?: number
  galleryIds?: string[]
}>(), {
  showVersionBadge: true,
  thumbnailMaxHeight: 300,
  galleryIds: () => [],
})

const emit = defineEmits<{
  'open-lightbox': [payload: { assetId: string; galleryIds: string[] }]
  'open-editor': [payload: { assetId: string }]
  'open-version-history': [payload: { assetId: string }]
  'download': [payload: { assetId: string; fileName: string }]
}>()

const typeIcon = computed(() => {
  switch (props.asset.assetType) {
    case 'image': return Image
    case 'markdown': return FileText
    default: return File
  }
})

const typeLabel = computed(() => {
  switch (props.asset.assetType) {
    case 'image': return 'Image'
    case 'markdown': return 'Document'
    default: return 'File'
  }
})

const primaryActionLabel = computed(() => {
  switch (props.asset.assetType) {
    case 'image': return 'View'
    case 'markdown': return 'Edit'
    default: return 'Download'
  }
})

function handlePrimaryAction() {
  switch (props.asset.assetType) {
    case 'image':
      emit('open-lightbox', { assetId: props.asset.assetId, galleryIds: props.galleryIds })
      break
    case 'markdown':
      emit('open-editor', { assetId: props.asset.assetId })
      break
    default:
      emit('download', { assetId: props.asset.assetId, fileName: props.asset.fileName })
  }
}
</script>

<template>
  <div class="result-surface-card" role="article" :aria-label="`${typeLabel}: ${asset.fileName}`">
    <!-- Header -->
    <div class="result-surface-card__header">
      <component :is="typeIcon" class="result-surface-card__header--icon" :size="16" />
      <span class="result-surface-card__header--label">{{ typeLabel }}</span>
      <span class="result-surface-card__header--filename" :title="asset.fileName">
        {{ asset.fileName }}
      </span>
      <span class="result-surface-card__header--size">{{ asset.fileSizeFormatted }}</span>
      <div class="result-surface-card__header--actions">
        <button
          v-if="showVersionBadge && asset.hasVersions"
          class="hc-btn hc-btn-ghost result-surface-card__version-btn"
          :aria-label="`Version history for ${asset.fileName}`"
          @click="emit('open-version-history', { assetId: asset.assetId })"
        >
          History
        </button>
        <button
          data-testid="primary-action"
          class="hc-btn hc-btn-primary"
          @click="handlePrimaryAction"
        >
          <component :is="asset.assetType === 'markdown' ? Pencil : (asset.assetType === 'image' ? Maximize2 : Download)" :size="14" />
          {{ primaryActionLabel }}
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="result-surface-card__divider" />

    <!-- Body -->
    <div class="result-surface-card__body" :class="`result-surface-card__body--${asset.assetType}`">
      <!-- Image preview -->
      <div v-if="asset.assetType === 'image'" class="asset-image-preview">
        <img
          v-if="asset.contentUrl"
          :src="asset.contentUrl"
          :alt="asset.fileName"
          class="asset-image-preview__img"
          :style="{ maxHeight: `${thumbnailMaxHeight}px` }"
        />
        <div v-else class="asset-image-preview__placeholder">
          <Image :size="32" />
          <span>Preview not available</span>
        </div>
      </div>

      <!-- Markdown preview (placeholder — full editor is F-003) -->
      <div v-else-if="asset.assetType === 'markdown'" class="asset-markdown-preview">
        <span class="asset-markdown-preview__hint">Click Edit to open in editor</span>
      </div>

      <!-- File fallback -->
      <div v-else class="asset-file-preview">
        <File :size="32" />
        <span>{{ asset.fileName }}</span>
      </div>
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

.result-surface-card__header {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-3) var(--hc-space-4);
}

.result-surface-card__header--icon {
  color: var(--hc-text-muted);
  flex-shrink: 0;
}

.result-surface-card__header--label {
  font-size: 12px;
  font-weight: 500;
  color: var(--hc-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-surface-card__header--filename {
  font-size: 13px;
  color: var(--hc-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.result-surface-card__header--size {
  font-size: 12px;
  color: var(--hc-text-muted);
  flex-shrink: 0;
}

.result-surface-card__header--actions {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  flex-shrink: 0;
}

.result-surface-card__divider {
  height: 1px;
  background: var(--hc-border);
}

.result-surface-card__body {
  padding: var(--hc-space-3) var(--hc-space-4);
}

.asset-image-preview {
  display: flex;
  justify-content: center;
}

.asset-image-preview__img {
  max-width: 100%;
  border-radius: var(--hc-radius-md);
  object-fit: contain;
}

.asset-image-preview__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-6);
  color: var(--hc-text-muted);
}

.asset-markdown-preview__hint {
  font-size: 13px;
  color: var(--hc-text-secondary);
}

.asset-file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-4);
  color: var(--hc-text-secondary);
}

/* Focus indicators for accessibility */
.result-surface-card button:focus-visible {
  outline: 2px solid var(--hc-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .result-surface-card {
    animation: none;
  }
}

@media (max-width: 400px) {
  .result-surface-card__header {
    flex-wrap: wrap;
  }
  .result-surface-card__header--size {
    display: none;
  }
}
</style>
