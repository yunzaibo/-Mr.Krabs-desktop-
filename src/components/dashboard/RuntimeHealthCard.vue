<!--
  RuntimeHealthCard — Dashboard Runtime 健康状态卡片。
  消费 useDashboardRuntime().healthStatus。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import type { DashboardHealthStatus } from '@/composables/useDashboardRuntime'

const props = defineProps<{
  health: DashboardHealthStatus
}>()

const { t } = useI18n()
const appStore = useAppStore()

const statusVariant = computed(() => {
  if (!appStore.sidecarReady) return 'error'
  switch (props.health.overall) {
    case 'healthy': return 'success'
    case 'degraded': return 'warning'
    case 'error': return 'error'
    default: return 'default'
  }
})

const statusLabel = computed(() => {
  if (!appStore.sidecarReady) return t('dashboard.disconnected', 'Disconnected')
  switch (props.health.overall) {
    case 'healthy': return t('dashboard.healthy', 'Healthy')
    case 'degraded': return t('dashboard.degraded', 'Degraded')
    case 'error': return t('dashboard.error', 'Error')
    default: return t('dashboard.unknown', 'Unknown')
  }
})

const recoveryCount = computed(() => props.health.recoveries.length)
const failedRecoveries = computed(() =>
  props.health.recoveries.filter((r) => r.resolution === 'failed').length,
)
</script>

<template>
  <div class="rh-card">
    <div class="rh-card__header">
      <span class="rh-card__title">{{ t('dashboard.runtimeHealth', 'Runtime Health') }}</span>
      <span class="rh-card__badge" :class="`rh-card__badge--${statusVariant}`">
        {{ statusLabel }}
      </span>
    </div>
    <div class="rh-card__body">
      <div class="rh-card__row">
        <span class="rh-card__label">{{ t('dashboard.activeTasks', 'Active Tasks') }}</span>
        <span class="rh-card__value">{{ health.activeTasks }}</span>
      </div>
      <div class="rh-card__row">
        <span class="rh-card__label">{{ t('dashboard.failedToday', 'Failed Today') }}</span>
        <span class="rh-card__value" :class="{ 'rh-card__value--error': health.failedToday > 0 }">
          {{ health.failedToday }}
        </span>
      </div>
      <div v-if="recoveryCount > 0" class="rh-card__row">
        <span class="rh-card__label">{{ t('dashboard.recoveries', 'Recoveries') }}</span>
        <span class="rh-card__value" :class="{ 'rh-card__value--warning': failedRecoveries > 0 }">
          {{ recoveryCount }}
          <span v-if="failedRecoveries > 0" class="rh-card__sub">
            ({{ failedRecoveries }} {{ t('dashboard.failed', 'failed') }})
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rh-card {
  background: var(--hc-bg-card);
  border: 1px solid var(--hc-border);
  border-radius: 14px;
  overflow: hidden;
}
.rh-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}
.rh-card__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--hc-text-primary);
}
.rh-card__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}
.rh-card__badge--success {
  background: rgba(34, 197, 94, 0.12);
  color: var(--hc-success, #22c55e);
}
.rh-card__badge--warning {
  background: rgba(240, 180, 41, 0.12);
  color: var(--hc-warning, #f0b429);
}
.rh-card__badge--error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--hc-error, #ef4444);
}
.rh-card__badge--default {
  background: var(--hc-bg-elevated);
  color: var(--hc-text-muted);
}
.rh-card__body {
  padding: 0 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rh-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}
.rh-card__label {
  color: var(--hc-text-muted);
}
.rh-card__value {
  font-weight: 600;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: var(--hc-text-primary);
}
.rh-card__value--error {
  color: var(--hc-error, #ef4444);
}
.rh-card__value--warning {
  color: var(--hc-warning, #f0b429);
}
.rh-card__sub {
  font-weight: 400;
  color: var(--hc-text-muted);
  font-family: inherit;
}
</style>
