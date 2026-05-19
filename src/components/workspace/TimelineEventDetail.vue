<script setup lang="ts">
/**
 * TimelineEventDetail — Timeline 事件详情展开区域。
 *
 * expanded=true 时渲染事件详情：type、timestamp、payload summary、metadata。
 * expanded=false 时不渲染任何内容。
 *
 * 无障碍：role="region" + :aria-label。
 */
import type { RuntimeEvent } from '@/types/timeline'

const props = defineProps<{
  event: RuntimeEvent
  expanded: boolean
}>()

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <div
    v-if="props.expanded"
    class="hc-event-detail"
    role="region"
    :aria-label="`Event detail: ${props.event.type}`"
  >
    <div class="hc-event-detail__row">
      <span class="hc-event-detail__label">Type</span>
      <span class="hc-event-detail__type">{{ props.event.type }}</span>
    </div>

    <div class="hc-event-detail__row">
      <span class="hc-event-detail__label">Timestamp</span>
      <span class="hc-event-detail__value">{{ formatTimestamp(props.event.timestamp) }}</span>
    </div>

    <template v-if="props.event.payload">
      <div v-if="props.event.payload.summary" class="hc-event-detail__row">
        <span class="hc-event-detail__label">Summary</span>
        <span class="hc-event-detail__value">{{ props.event.payload.summary }}</span>
      </div>

      <div
        v-if="props.event.payload.metadata && Object.keys(props.event.payload.metadata).length > 0"
        class="hc-event-detail__metadata"
      >
        <div class="hc-event-detail__label">Metadata</div>
        <div class="hc-event-detail__metadata-grid">
          <template v-for="(val, key) in props.event.payload.metadata" :key="String(key)">
            <span class="hc-event-detail__meta-key">{{ key }}</span>
            <span class="hc-event-detail__meta-val">{{ val }}</span>
          </template>
        </div>
      </div>
    </template>

    <div v-if="!props.event.payload" class="hc-event-detail__empty">
      No payload data
    </div>
  </div>
</template>

<style scoped>
.hc-event-detail {
  padding: 8px 12px;
  border-top: 1px solid var(--hc-border);
  background: var(--hc-bg-subtle);
  font-size: 12px;
}

.hc-event-detail__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.hc-event-detail__label {
  color: var(--hc-text-muted);
  font-size: 11px;
  min-width: 72px;
}

.hc-event-detail__type {
  font-family: var(--hc-font-mono, ui-monospace, monospace);
  color: var(--hc-accent);
  font-size: 12px;
}

.hc-event-detail__value {
  color: var(--hc-text-secondary);
}

.hc-event-detail__metadata {
  margin-top: 4px;
}

.hc-event-detail__metadata-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 8px;
  margin-top: 2px;
}

.hc-event-detail__meta-key {
  font-family: var(--hc-font-mono, ui-monospace, monospace);
  color: var(--hc-text-muted);
  font-size: 11px;
}

.hc-event-detail__meta-val {
  color: var(--hc-text-secondary);
  font-size: 11px;
  word-break: break-all;
}

.hc-event-detail__empty {
  color: var(--hc-text-muted);
  font-style: italic;
}
</style>
