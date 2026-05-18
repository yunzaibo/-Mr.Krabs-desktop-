<!--
  RuntimeEventsCard — Dashboard 最近 Runtime 事件列表。
  消费 useDashboardRuntime().recentEvents。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RuntimeEvent } from '@/types/timeline'

const props = defineProps<{
  events: RuntimeEvent[]
}>()

const { t } = useI18n()

const displayEvents = computed(() => props.events.slice(0, 5))

function formatTime(ts?: string): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('dashboard.justNow', 'just now')
    if (mins < 60) return t('dashboard.minutesAgo', { n: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('dashboard.hoursAgo', { n: hours })
    return t('dashboard.daysAgo', { n: Math.floor(hours / 24) })
  } catch { return '' }
}

function eventColor(type: string): string {
  if (type.includes('completed')) return 'var(--hc-success, #22c55e)'
  if (type.includes('failed') || type.includes('error')) return 'var(--hc-error, #ef4444)'
  if (type.includes('created') || type.includes('started')) return 'var(--hc-accent)'
  return 'var(--hc-text-muted)'
}
</script>

<template>
  <div class="re-card">
    <div class="re-card__header">
      <span class="re-card__title">{{ t('dashboard.recentEvents', 'Recent Events') }}</span>
    </div>
    <div class="re-card__body">
      <template v-if="displayEvents.length > 0">
        <div v-for="(ev, i) in displayEvents" :key="i" class="re-card__item">
          <span class="re-card__dot" :style="{ background: eventColor(ev.type) }" />
          <span class="re-card__type">{{ ev.type }}</span>
          <span class="re-card__time">{{ formatTime(ev.timestamp) }}</span>
        </div>
      </template>
      <div v-else class="re-card__empty">
        {{ t('dashboard.noEvents', 'No recent events') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-card {
  background: var(--hc-bg-card);
  border: 1px solid var(--hc-border);
  border-radius: 14px;
  overflow: hidden;
}
.re-card__header {
  padding: 10px 14px;
}
.re-card__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--hc-text-primary);
}
.re-card__body {
  padding: 0 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.re-card__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.re-card__item:hover {
  background: var(--hc-accent-subtle);
}
.re-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.re-card__type {
  flex: 1;
  color: var(--hc-text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-card__time {
  color: var(--hc-text-muted);
  font-size: 11px;
  flex-shrink: 0;
}
.re-card__empty {
  padding: 12px;
  text-align: center;
  font-size: 11px;
  color: var(--hc-text-muted);
}
</style>
