<!--
  TaskCard — Linear/Cursor-style task execution card.

  Carried via ChatMessage.metadata as TaskCardMetadata.
  Replaces the chat bubble with a task-centric layout:
  left color bar + bordered card with header/body/footer.
-->
<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { TaskCardMetadata } from '@/types/taskCard'
import type { ResultSurfaceKind } from '@/types/resultSurface'
import MarkdownRenderer from './MarkdownRenderer.vue'
import SummaryResultCard from './SummaryResultCard.vue'
import BulletResultCard from './BulletResultCard.vue'

const props = defineProps<TaskCardMetadata & {
  resultKind?: ResultSurfaceKind
  content?: string
}>()

const router = useRouter()
const { t } = useI18n()

const displayElapsed = ref(props.elapsed ?? 0)
let intervalId: ReturnType<typeof setInterval> | null = null

function startTimer() {
  if (intervalId) return
  const base = props.elapsed ?? 0
  const startTs = Date.now()
  intervalId = setInterval(() => {
    displayElapsed.value = base + (Date.now() - startTs) / 1000
  }, 100)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

watch(
  () => props.status,
  (s) => {
    if (s === 'running') {
      startTimer()
    } else {
      stopTimer()
      if (props.elapsed != null) {
        displayElapsed.value = props.elapsed
      }
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopTimer()
})

const truncatedPreview = computed(() => {
  if (!props.resultPreview) return ''
  return props.resultPreview.length > 200
    ? props.resultPreview.slice(0, 200) + '...'
    : props.resultPreview
})

const visibleEvents = computed(() => {
  return (props.previewEvents ?? []).slice(0, 3)
})

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

const statusLabel = computed(() => {
  switch (props.status) {
    case 'running': return t('chat.taskCard.statusRunning')
    case 'completed': return t('chat.taskCard.statusCompleted')
    case 'failed': return t('chat.taskCard.statusFailed')
    case 'cancelled': return t('chat.taskCard.statusCancelled')
    default: return props.status
  }
})

const subtitle = computed(() => {
  switch (props.status) {
    case 'running': return `${t('chat.taskCard.running')} ${props.skillName}...`
    case 'completed': return `${t('chat.taskCard.completed')} \u00B7 ${formatElapsed(displayElapsed.value)}`
    default: return ''
  }
})

function openWorkspace() {
  router.push({ path: '/workspace', query: { taskId: props.taskId } })
}
</script>

<template>
  <div class="task-card" :class="`task-card--${status}`">
    <!-- Left color indicator bar -->
    <div class="task-card__bar" />

    <div class="task-card__content">
      <!-- Top: skillName + status badge + elapsed -->
      <div class="task-card__header">
        <span class="task-card__skill-name">{{ skillName }}</span>
        <span class="task-card__status-badge" :class="`task-card__status-badge--${status}`">
          {{ statusLabel }}
        </span>
        <span v-if="elapsed != null || status === 'running'" class="task-card__elapsed">
          {{ displayElapsed.toFixed(1) }}s
        </span>
      </div>

      <!-- Subtitle -->
      <div v-if="subtitle" class="task-card__subtitle">{{ subtitle }}</div>

      <!-- Result preview — ResultSurface for completed, fallback for others -->
      <template v-if="status === 'completed' && resultKind === 'summary'">
        <SummaryResultCard :content="content || ''" />
      </template>
      <template v-else-if="status === 'completed' && resultKind === 'bullet'">
        <BulletResultCard :content="content || ''" />
      </template>
      <div v-else-if="truncatedPreview" class="task-card__preview">
        <MarkdownRenderer :content="truncatedPreview" />
      </div>

      <!-- Bottom: previewEvents + Open Workspace -->
      <div v-if="visibleEvents.length > 0 || status !== 'running'" class="task-card__footer">
        <div v-if="visibleEvents.length > 0" class="task-card__events">
          <div v-for="(ev, i) in visibleEvents" :key="i" class="task-card__event-item">
            {{ ev }}
          </div>
        </div>
        <button class="task-card__workspace-btn" @click.stop="openWorkspace">
          {{ t('chat.taskCard.openWorkspace') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  display: flex;
  flex-direction: row;
  gap: 0;
  margin: 8px 0;
  border: 1px solid var(--hc-border);
  border-radius: var(--hc-radius-xl);
  background: var(--hc-bg-card);
  box-shadow: var(--hc-shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.task-card:hover {
  box-shadow: var(--hc-shadow-md);
  border-color: var(--hc-accent);
}

/* Left color indicator bar */
.task-card__bar {
  width: 4px;
  flex-shrink: 0;
}
.task-card--running .task-card__bar {
  background: #3b82f6;
}
.task-card--completed .task-card__bar {
  background: #22c55e;
}
.task-card--failed .task-card__bar {
  background: #ef4444;
}
.task-card--cancelled .task-card__bar {
  background: #9ca3af;
}

/* Content area */
.task-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  min-width: 0;
}

/* Header */
.task-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-card__skill-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--hc-text-primary);
  letter-spacing: -0.01em;
}
.task-card__elapsed {
  font-size: 11px;
  color: var(--hc-text-muted);
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

/* Status badge */
.task-card__status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 4px;
}
.task-card__status-badge--running {
  background: #dbeafe;
  color: #2563eb;
  animation: task-card-pulse 2s ease-in-out infinite;
}
.task-card__status-badge--completed {
  background: #dcfce7;
  color: #16a34a;
}
.task-card__status-badge--failed {
  background: #fee2e2;
  color: #dc2626;
}
.task-card__status-badge--cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

@keyframes task-card-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Subtitle */
.task-card__subtitle {
  font-size: 12px;
  color: var(--hc-text-muted);
  margin-top: -2px;
}

/* Result preview */
.task-card__preview {
  font-size: 13px;
  line-height: 1.5;
  color: var(--hc-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Footer */
.task-card__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-top: 6px;
  border-top: 0.5px solid var(--hc-border);
  margin-top: 4px;
}
.task-card__events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.task-card__event-item {
  font-size: 12px;
  color: var(--hc-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Workspace button */
.task-card__workspace-btn {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--hc-border);
  background: var(--hc-bg-elevated);
  color: var(--hc-text-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.task-card__workspace-btn:hover {
  background: var(--hc-accent-subtle);
  border-color: var(--hc-accent);
  color: var(--hc-accent);
}
.task-card--completed .task-card__workspace-btn {
  background: var(--hc-accent);
  color: white;
  border-color: var(--hc-accent);
}
.task-card--completed .task-card__workspace-btn:hover {
  background: color-mix(in srgb, var(--hc-accent) 85%, black);
}
</style>
