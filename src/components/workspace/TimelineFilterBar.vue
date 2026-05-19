<script setup lang="ts">
/**
 * TimelineFilterBar — Timeline 事件类别过滤条。
 *
 * 5 个 filter chip（All / Task / Context / Skill / Recovery），
 * 每个 chip 附带 count badge（count > 0 时显示）。
 * 无障碍：role="tablist" + role="tab"。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimelineEventCategory } from '@/types/workspace'

const { t } = useI18n()

const props = defineProps<{
  filter: TimelineEventCategory
  eventCounts: Record<TimelineEventCategory, number>
}>()

const emit = defineEmits<{
  'update:filter': [value: TimelineEventCategory]
}>()

interface FilterChip {
  key: TimelineEventCategory
  labelKey: string
  fallback: string
}

const chipDefs: FilterChip[] = [
  { key: 'all', labelKey: 'timeline.filter.all', fallback: 'All' },
  { key: 'task', labelKey: 'timeline.filter.task', fallback: 'Task' },
  { key: 'context', labelKey: 'timeline.filter.context', fallback: 'Context' },
  { key: 'skill', labelKey: 'timeline.filter.skill', fallback: 'Skill' },
  { key: 'recovery', labelKey: 'timeline.filter.recovery', fallback: 'Recovery' },
]

const chips = computed(() =>
  chipDefs.map((c) => ({ key: c.key, label: t(c.labelKey, c.fallback) })),
)

function selectFilter(key: TimelineEventCategory) {
  emit('update:filter', key)
}
</script>

<template>
  <div class="timeline-filter-bar" role="tablist" aria-label="Timeline event filter">
    <button
      v-for="chip in chips"
      :key="chip.key"
      class="hc-filter-chip"
      :class="{ 'hc-filter-chip--active': props.filter === chip.key }"
      role="tab"
      :aria-selected="props.filter === chip.key"
      @click="selectFilter(chip.key)"
    >
      <span class="hc-filter-chip__label">{{ chip.label }}</span>
      <span
        v-if="(props.eventCounts[chip.key] ?? 0) > 0"
        class="hc-filter-chip__badge"
      >
        {{ props.eventCounts[chip.key] }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.timeline-filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
}

.hc-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--hc-border);
  border-radius: 100px;
  background: transparent;
  color: var(--hc-text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
  line-height: 1;
}

.hc-filter-chip:hover {
  border-color: var(--hc-accent-subtle);
}

.hc-filter-chip--active {
  background: var(--hc-accent-subtle);
  border-color: var(--hc-accent);
  color: var(--hc-accent);
}

.hc-filter-chip__badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--hc-text-muted);
  background: var(--hc-bg-active);
  padding: 0 5px;
  border-radius: 100px;
  line-height: 1.6;
}
</style>
