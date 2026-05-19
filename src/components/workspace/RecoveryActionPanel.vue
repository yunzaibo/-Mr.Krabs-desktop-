<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RecoverySummary } from '@/types/recovery'

const { t } = useI18n()

const props = defineProps<{
  assessment: RecoverySummary | null
  resolutionState: 'none' | 'pending' | 'resolved' | 'failed'
  corruptionReport?: { corrupted: boolean; details: string[] }
  isExecuting?: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'cleanRestart'): void
  (e: 'dismiss'): void
}>()

const visible = computed(() => props.assessment !== null)

const badgeVariant = computed(() => {
  if (!props.assessment) return 'default'
  switch (props.assessment.assessmentState) {
    case 'recoverable': return 'warning'
    case 'unrecoverable': return 'error'
    default: return 'default'
  }
})

const badgeLabel = computed(() => {
  if (!props.assessment) return ''
  switch (props.assessment.assessmentState) {
    case 'recoverable': return t('workspace.recovery.recoverable')
    case 'unrecoverable': return t('workspace.recovery.unrecoverable')
    default: return t('workspace.recovery.corrupted')
  }
})

const canRetry = computed(() =>
  props.assessment?.assessmentState === 'recoverable' && !props.isExecuting
)

const canReset = computed(() =>
  (props.assessment?.assessmentState === 'unrecoverable' || props.resolutionState === 'failed') &&
  !props.isExecuting
)

function handleRetry() {
  emit('retry')
}

function handleReset() {
  if (window.confirm(t('workspace.recovery.confirmReset'))) {
    emit('cleanRestart')
  }
}
</script>

<template>
  <div v-if="visible" class="recovery-panel" role="region" :aria-label="t('workspace.recovery.title')">
    <div class="recovery-panel__header">
      <span class="recovery-panel__title">{{ t('workspace.recovery.title') }}</span>
      <span :class="`recovery-panel__badge recovery-panel__badge--${badgeVariant}`">
        {{ badgeLabel }}
      </span>
    </div>

    <div v-if="assessment?.failureType" class="recovery-panel__info">
      <span class="recovery-panel__failure-type">{{ assessment.failureType }}</span>
    </div>

    <div v-if="corruptionReport?.corrupted" class="recovery-panel__corruption">
      <span class="recovery-panel__corruption-label">{{ t('workspace.recovery.corrupted') }}</span>
    </div>

    <div class="recovery-panel__actions">
      <button
        v-if="canRetry"
        class="recovery-panel__btn recovery-panel__btn--primary"
        :disabled="isExecuting"
        @click="handleRetry"
      >
        {{ t('workspace.recovery.tryAgain') }}
      </button>
      <button
        v-if="canReset"
        class="recovery-panel__btn recovery-panel__btn--secondary"
        :disabled="isExecuting"
        @click="handleReset"
      >
        {{ t('workspace.recovery.resetContext') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.recovery-panel {
  border: 1px solid var(--hc-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--hc-radius-lg, 14px);
  padding: var(--hc-space-3, 12px);
  background: var(--hc-bg-card, rgba(255, 255, 255, 0.03));
  animation: hc-scale-in 0.2s ease-out;
}

.recovery-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--hc-space-2, 8px);
}

.recovery-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--hc-text-primary, #f0f0f3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.recovery-panel__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.recovery-panel__badge--warning {
  background: rgba(240, 180, 41, 0.12);
  color: var(--hc-warning, #f0b429);
}

.recovery-panel__badge--error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--hc-error, #ef4444);
}

.recovery-panel__badge--default {
  background: var(--hc-bg-elevated);
  color: var(--hc-text-muted);
}

.recovery-panel__info {
  font-size: 12px;
  color: var(--hc-text-secondary, #9d9da7);
  margin-bottom: var(--hc-space-2, 8px);
}

.recovery-panel__corruption {
  font-size: 11px;
  color: var(--hc-error, #f56565);
  margin-bottom: var(--hc-space-2, 8px);
}

.recovery-panel__actions {
  display: flex;
  gap: var(--hc-space-2, 8px);
}

.recovery-panel__btn {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: var(--hc-radius-sm, 6px);
  border: 1px solid var(--hc-border, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  transition: all 0.15s ease;
}

.recovery-panel__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recovery-panel__btn--primary {
  background: var(--hc-accent, #2563eb);
  color: white;
  border-color: var(--hc-accent, #2563eb);
}

.recovery-panel__btn--primary:hover:not(:disabled) {
  background: var(--hc-accent-hover, #1d4ed8);
}

.recovery-panel__btn--secondary {
  background: transparent;
  color: var(--hc-text-secondary, #9d9da7);
}

.recovery-panel__btn--secondary:hover:not(:disabled) {
  background: var(--hc-bg-elevated);
  color: var(--hc-text-primary);
}
</style>
