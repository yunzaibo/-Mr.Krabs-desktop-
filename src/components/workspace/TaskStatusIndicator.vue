<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  status: 'running' | 'pending' | 'completed' | 'failed' | 'cancelled'
  elapsed?: number | string
}>()

const dotClass = computed(() => {
  switch (props.status) {
    case 'running': return 'hc-live-pulse'
    case 'failed': return 'hc-live-pulse hc-live-pulse--error'
    case 'pending': return 'hc-live-pulse hc-live-pulse--warning'
    default: return 'hc-live-pulse hc-live-pulse--muted'
  }
})

const statusText = computed(() => t(`workspace.status.${props.status}`))

const showElapsed = computed(() => props.status === 'running' && props.elapsed != null)

const displayElapsed = computed(() => {
  if (props.elapsed == null) return ''
  if (typeof props.elapsed === 'string') return props.elapsed
  if (props.elapsed < 60) return `${props.elapsed}s`
  const m = Math.floor(props.elapsed / 60)
  const s = props.elapsed % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
})
</script>

<template>
  <div class="task-status-indicator" role="status" :aria-live="status === 'running' ? 'polite' : 'off'">
    <span :class="dotClass" :aria-label="statusText" />
    <span class="task-status-indicator__label">{{ statusText }}</span>
    <span v-if="showElapsed" class="task-status-indicator__elapsed">{{ displayElapsed }}</span>
  </div>
</template>

<style scoped>
.task-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-2, 8px);
  font-size: 12px;
  color: var(--hc-text-secondary, #9d9da7);
}
.task-status-indicator__label {
  font-weight: 500;
}
.task-status-indicator__elapsed {
  font-variant-numeric: tabular-nums;
  color: var(--hc-text-muted, #5c5c6b);
}
</style>
