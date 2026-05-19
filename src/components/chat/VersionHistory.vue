<!--
  VersionHistory — Sidebar showing snapshot versions with restore capability.
-->
<script setup lang="ts">
import { X, RotateCcw } from 'lucide-vue-next'
import type { SnapshotVersion } from '@/types/asset'

const props = defineProps<{
  versions: SnapshotVersion[]
  isOpen: boolean
}>()

const emit = defineEmits<{
  restore: [versionNumber: number]
  close: []
}>()

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return d.toLocaleDateString()
}
</script>

<template>
  <div v-if="isOpen" class="version-history" role="complementary" aria-label="Version history">
    <!-- Header -->
    <div class="version-history__header">
      <span class="version-history__title">Version History</span>
      <button class="version-history__close hc-btn hc-btn-ghost" aria-label="Close" @click="emit('close')">
        <X :size="18" />
      </button>
    </div>

    <!-- Version list -->
    <div class="version-history__list">
      <div
        v-for="version in versions"
        :key="version.versionNumber"
        class="version-history__item"
      >
        <div class="version-history__item-header">
          <span class="version-history__version">v{{ version.versionNumber }}</span>
          <span class="version-history__date">{{ formatDate(version.createdAt) }}</span>
        </div>
        <div v-if="version.description" class="version-history__description">
          {{ version.description }}
        </div>
        <button
          class="version-history__restore-btn hc-btn hc-btn-ghost-outline"
          @click="emit('restore', version.versionNumber)"
        >
          <RotateCcw :size="14" />
          Restore
        </button>
      </div>

      <div v-if="versions.length === 0" class="version-history__empty">
        No versions yet
      </div>
    </div>
  </div>
</template>

<style scoped>
.version-history {
  width: 280px;
  border-left: 1px solid var(--hc-border);
  background: var(--hc-bg-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.version-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--hc-space-3) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-border);
}

.version-history__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--hc-text-primary);
}

.version-history__list {
  flex: 1;
  overflow-y: auto;
  padding: var(--hc-space-2);
}

.version-history__item {
  padding: var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  transition: background 0.15s;
}

.version-history__item:hover {
  background: var(--hc-bg-hover);
}

.version-history__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--hc-space-1);
}

.version-history__version {
  font-size: 13px;
  font-weight: 600;
  color: var(--hc-text-primary);
}

.version-history__date {
  font-size: 12px;
  color: var(--hc-text-muted);
}

.version-history__description {
  font-size: 12px;
  color: var(--hc-text-secondary);
  margin-bottom: var(--hc-space-2);
}

.version-history__restore-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-1);
  font-size: 12px;
  padding: var(--hc-space-1) var(--hc-space-2);
}

.version-history__empty {
  padding: var(--hc-space-6);
  text-align: center;
  color: var(--hc-text-muted);
  font-size: 13px;
}

.version-history button:focus-visible {
  outline: 2px solid var(--hc-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .version-history__item {
    transition: none;
  }
}
</style>
