<script setup lang="ts">
/**
 * TimelinePanel — AI Task Narrative Timeline 面板。
 *
 * 默认显示 Narrative 视图（TimelineNarrativeGroup[]）。
 * 保留 raw events 视图作为 toggle 备选。
 * 消费 Projection DTO，不 import RuntimeEvent。
 */
import { ref, computed, watch, onUnmounted, onUpdated, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimelineItemProjection, TimelineNarrativeGroup, NarrativePhase, TimelineEventCategory } from '@/types/workspace'
import TimelineItem from '@/components/inspector/TimelineItem.vue'
import TimelineFilterBar from './TimelineFilterBar.vue'
import TimelineEventDetail from './TimelineEventDetail.vue'

const { t } = useI18n()

const _props = defineProps<{
  items: TimelineItemProjection[]
  narrativeItems: TimelineNarrativeGroup[]
  taskId: string | null
  taskStatus?: string  // 'running' | 'pending' | 'completed' | 'failed' | 'cancelled'
  showFilter?: boolean
  currentFilter?: TimelineEventCategory
  eventCounts?: Record<TimelineEventCategory, number>
}>()

const emit = defineEmits<{
  'update:filter': [value: TimelineEventCategory]
}>()

// ── 视图模式 ──────────────────────────────────────

type ViewMode = 'narrative' | 'raw'
const viewMode = ref<ViewMode>('narrative')

// ── Phase → color ────────────────────────────────

const PHASE_COLORS: Record<NarrativePhase, string> = {
  creation: 'var(--hc-accent)',
  preparation: '#a78bfa',
  execution: '#f59e0b',
  completion: 'var(--hc-success)',
  failure: 'var(--hc-error)',
  anomaly: '#f97316',
  maintenance: 'var(--hc-text-muted)',
}

// ── 展开状态（折叠 group 的 expand/collapse） ────

const expandedGroups = ref<Set<string>>(new Set())

function toggleGroup(id: string) {
  if (expandedGroups.value.has(id)) {
    expandedGroups.value.delete(id)
  } else {
    expandedGroups.value.add(id)
  }
}

function isExpanded(id: string): boolean {
  return expandedGroups.value.has(id)
}

// ── Event detail expand（accordion） ────────────────

const expandedEventId = ref<string | null>(null)

function toggleEventExpand(id: string) {
  expandedEventId.value = expandedEventId.value === id ? null : id
}

// ── Filter ──────────────────────────────────────────

function onFilterChange(category: TimelineEventCategory) {
  emit('update:filter', category)
}

// ── Event color helper ──────────────────────────────

function getEventColor(type: string): string {
  if (type.includes('completed')) return 'var(--hc-success, #22c55e)'
  if (type.includes('failed') || type.includes('error')) return 'var(--hc-error, #ef4444)'
  if (type.includes('created') || type.includes('started')) return 'var(--hc-accent)'
  return 'var(--hc-text-muted)'
}

// ── duration format（UI 层负责 presentation） ────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

// ── Running detection ────────────────────────────

const isTaskRunning = computed(() => {
  // Primary: task status
  if (_props.taskStatus === 'running' || _props.taskStatus === 'pending') return true
  // Fallback: phase detection
  if (_props.narrativeItems.length === 0) return false
  const lastGroup = _props.narrativeItems[_props.narrativeItems.length - 1]!
  return lastGroup.phase !== 'completion' && lastGroup.phase !== 'failure'
})

// ── Running duration (setInterval 1s) ────────────

let intervalId: ReturnType<typeof setInterval> | null = null
const runningElapsed = ref('')

function updateRunningDuration() {
  if (!isTaskRunning.value) {
    runningElapsed.value = ''
    return
  }
  const lastGroup = _props.narrativeItems[_props.narrativeItems.length - 1]
  if (lastGroup) {
    const startMs = new Date(lastGroup.startTime).getTime()
    runningElapsed.value = formatDuration(Date.now() - startMs)
  }
}

function startRunningTimer() {
  stopRunningTimer()
  updateRunningDuration()
  intervalId = setInterval(updateRunningDuration, 1000)
}

function stopRunningTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  runningElapsed.value = ''
}

watch(isTaskRunning, (running) => {
  if (running) startRunningTimer()
  else stopRunningTimer()
}, { immediate: true })

onUnmounted(() => {
  stopRunningTimer()
})

// ── Auto-scroll ──────────────────────────────────

const narrativeContainer = ref<HTMLElement | null>(null)
const isNearBottom = ref(true)

function checkScrollPosition() {
  const el = narrativeContainer.value
  if (!el) return
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 50
}

function scrollToLatest() {
  if (!isNearBottom.value) return
  nextTick(() => {
    const el = narrativeContainer.value
    if (!el) return
    const lastGroup = el.querySelector('.narrative-group:last-child')
    lastGroup?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

watch(() => _props.narrativeItems.length, () => {
  scrollToLatest()
})

// ── Entrance animation ───────────────────────────

const prevGroupCount = ref(0)

onUpdated(() => {
  const currentCount = _props.narrativeItems.length
  if (currentCount > prevGroupCount.value) {
    nextTick(() => {
      const el = narrativeContainer.value
      if (!el) return
      const groups = el.querySelectorAll('.narrative-group')
      const lastGroup = groups[groups.length - 1]
      if (lastGroup) {
        lastGroup.classList.add('narrative-group--entering')
        setTimeout(() => lastGroup.classList.remove('narrative-group--entering'), 300)
      }
    })
  }
  prevGroupCount.value = currentCount
})
</script>

<template>
  <div class="timeline-panel">
    <!-- Header -->
    <div class="timeline-panel__header">
      <span class="timeline-panel__title">{{ t('workspace.timeline.title') }}</span>
      <span v-if="narrativeItems.length > 0" class="timeline-panel__count">{{ narrativeItems.length }}</span>
    </div>

    <!-- View toggle -->
    <div class="timeline-panel__toggle-row">
      <button
        class="timeline-panel__toggle-btn"
        :class="{ 'timeline-panel__toggle-btn--active': viewMode === 'narrative' }"
        @click="viewMode = 'narrative'"
      >
        {{ t('workspace.timeline.filterAll') }}
      </button>
      <button
        class="timeline-panel__toggle-btn"
        :class="{ 'timeline-panel__toggle-btn--active': viewMode === 'raw' }"
        @click="viewMode = 'raw'"
      >
        {{ t('workspace.narrative.showRaw') }}
      </button>
    </div>

    <!-- Filter bar -->
    <TimelineFilterBar
      v-if="showFilter"
      class="hc-filter-bar"
      :filter="currentFilter ?? 'all'"
      :event-counts="eventCounts ?? { all: 0, task: 0, context: 0, skill: 0, recovery: 0 }"
      @update:filter="onFilterChange"
    />

    <!-- Empty state -->
    <div v-if="!taskId" class="timeline-panel__empty">
      <p>{{ t('workspace.timeline.emptyHint') }}</p>
    </div>
    <div
      v-else-if="viewMode === 'narrative' && narrativeItems.length === 0"
      class="timeline-panel__empty"
    >
      <p>{{ t('workspace.timeline.empty') }}</p>
    </div>
    <div
      v-else-if="viewMode === 'raw' && items.length === 0"
      class="timeline-panel__empty"
    >
      <p>{{ t('workspace.timeline.empty') }}</p>
    </div>

    <!-- Narrative view -->
    <div
      v-else-if="viewMode === 'narrative'"
      ref="narrativeContainer"
      class="timeline-panel__narrative"
      @scroll="checkScrollPosition"
    >
      <div
        v-for="(group, idx) in narrativeItems"
        :key="group.id"
        class="narrative-group"
        :class="{
          'narrative-group--collapsed': group.isCollapsed && !isExpanded(group.id),
          'narrative-group--pulse': isTaskRunning && idx === narrativeItems.length - 1
        }"
      >
        <!-- Group header -->
        <div class="narrative-group__header">
          <span
            class="narrative-group__dot"
            :style="{ background: PHASE_COLORS[group.phase] }"
            aria-hidden="true"
          />
          <div class="narrative-group__body">
            <div class="narrative-group__title-row">
              <span class="narrative-group__title">{{ t(group.title) }}</span>
              <span
                v-if="isTaskRunning && idx === narrativeItems.length - 1"
                class="narrative-group__duration"
              >
                {{ runningElapsed }}
              </span>
              <span
                v-else-if="group.durationMs !== undefined"
                class="narrative-group__duration"
              >
                {{ formatDuration(group.durationMs) }}
              </span>
            </div>
            <p v-if="group.description" class="narrative-group__desc">
              {{ group.description }}
            </p>

            <!-- Expanded children -->
            <div
              v-if="group.isCollapsed && isExpanded(group.id)"
              class="narrative-group__children"
            >
              <TimelineItem
                v-for="(child, idx) in group.children"
                :key="idx"
                :time="child.time"
                :text="`${t(child.typeLabel)} · ${child.summary}`"
                :dot-color="PHASE_COLORS[group.phase]"
              />
            </div>
          </div>

          <!-- Expand/collapse button for folded groups -->
          <button
            v-if="group.isCollapsed"
            class="narrative-group__expand-btn"
            @click="toggleGroup(group.id)"
          >
            <span class="narrative-group__expand-chevron" :class="{ 'narrative-group__expand-chevron--open': isExpanded(group.id) }">
              ▶
            </span>
          </button>

          <!-- Event count badge -->
          <span
            v-if="group.eventCount > 1"
            class="narrative-group__badge"
          >
            {{ group.eventCount }}
          </span>
        </div>
      </div>
    </div>

    <!-- Raw events view -->
    <div v-else class="timeline-panel__events">
      <div
        v-for="(item, idx) in items"
        :key="item.id ?? idx"
        class="timeline-event-row"
        :class="{ 'timeline-event-row--expanded': expandedEventId === (item.id ?? String(idx)) }"
        @click="toggleEventExpand(item.id ?? String(idx))"
      >
        <TimelineItem
          :time="item.time"
          :text="`${t(item.typeLabel)} · ${item.summary}`"
          :dot-color="getEventColor(item.typeCategory)"
        />
        <TimelineEventDetail
          v-if="item.event"
          :event="item.event"
          :expanded="expandedEventId === (item.id ?? String(idx))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.timeline-panel__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.timeline-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--hc-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-panel__count {
  font-size: 10px;
  font-weight: 600;
  color: var(--hc-text-muted);
  background: var(--hc-bg-hover);
  padding: 0 6px;
  border-radius: 100px;
  line-height: 1.6;
}

.timeline-panel__toggle-row {
  display: flex;
  gap: 4px;
  padding: 0 4px;
}

.timeline-panel__toggle-btn {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid var(--hc-border);
  border-radius: 100px;
  background: transparent;
  color: var(--hc-text-secondary);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}

.timeline-panel__toggle-btn:hover {
  border-color: var(--hc-accent-subtle);
}

.timeline-panel__toggle-btn--active {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--hc-accent);
  color: var(--hc-accent);
}

.timeline-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
}

.timeline-panel__empty p {
  font-size: 12px;
  color: var(--hc-text-muted);
  text-align: center;
  margin: 0;
}

.timeline-panel__events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

/* ── Event row (accordion) ────────────────────────── */

.timeline-event-row {
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.timeline-event-row:hover {
  background: var(--hc-bg-hover);
}

.timeline-event-row--expanded {
  background: var(--hc-bg-subtle, rgba(99, 102, 241, 0.04));
}

/* ── Narrative groups ───────────────────────────── */

.timeline-panel__narrative {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.narrative-group {
  border-radius: 8px;
  padding: 8px 10px;
  transition: background 0.15s;
}

.narrative-group:hover {
  background: var(--hc-bg-hover);
}

.narrative-group--collapsed {
  /* subtle indent hint that it's foldable */
}

.narrative-group__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.narrative-group__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.narrative-group__body {
  min-width: 0;
  flex: 1;
}

.narrative-group__title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.narrative-group__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--hc-text-primary);
  line-height: 1.4;
}

.narrative-group__duration {
  font-size: 10px;
  color: var(--hc-text-muted);
  white-space: nowrap;
}

.narrative-group__desc {
  margin: 3px 0 0;
  font-size: 11px;
  color: var(--hc-text-secondary);
  line-height: 1.4;
}

.narrative-group__children {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 0.5px solid var(--hc-divider);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.narrative-group__expand-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--hc-text-muted);
  cursor: pointer;
  border-radius: 4px;
  margin-top: 1px;
}

.narrative-group__expand-btn:hover {
  background: var(--hc-bg-active);
}

.narrative-group__expand-chevron {
  font-size: 7px;
  transition: transform 0.15s;
}

.narrative-group__expand-chevron--open {
  transform: rotate(90deg);
}

.narrative-group__badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--hc-text-muted);
  background: var(--hc-bg-active);
  padding: 1px 6px;
  border-radius: 100px;
  margin-top: 1px;
}

/* ── Pulse animation for running tasks ─────────── */

.narrative-group--pulse .narrative-group__dot {
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

/* ── Entrance animation for new groups ─────────── */

.narrative-group--entering {
  animation: narrative-enter 0.3s ease-out;
}

@keyframes narrative-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
