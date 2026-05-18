<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useDashboardRuntime } from '@/composables/useDashboardRuntime'
import { RefreshCw, Activity } from 'lucide-vue-next'
import RuntimeEventsCard from '@/components/dashboard/RuntimeEventsCard.vue'
import RuntimeHealthCard from '@/components/dashboard/RuntimeHealthCard.vue'
import PageToolbar from '@/components/common/PageToolbar.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SegmentedControl from '@/components/common/SegmentedControl.vue'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()
const runtime = useDashboardRuntime()

const dashTab = ref('today')
const dashTabs = computed(() => [
  { key: 'today', label: t('dashboard.today', 'Today') },
  { key: 'week', label: t('dashboard.lastWeek', 'Last 7 Days') },
  { key: 'system', label: t('dashboard.system', 'System') },
])

const stats = ref({
  totalSessions: 0,
  totalMessages: 0,
  activeAgents: 0,
  knowledgeDocs: 0,
  memoryEntries: 0,
  mcpServers: 0,
  llmProviders: 0,
  tasksRunToday: 0,
  todayMessages: 0,
  imChannels: 0,
})

const loading = ref(true)
const lastRefreshed = ref<Date | null>(null)
const countdown = ref(30)

// ── Runtime 数据（响应式，无需轮询） ──────────────
const runtimeStats = computed(() => ({
  activeTasks: runtime.activeTaskCount.value,
  completedToday: runtime.completedTodayCount.value,
  failedToday: runtime.failedTodayCount.value,
}))
let refreshTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

interface RecentActivity {
  id: string
  title: string
  type: 'chat' | 'agent' | 'task'
  time: string
}
const recentActivity = ref<RecentActivity[]>([])

interface WorkflowEntry {
  id: string
  title: string
  description: string
  badge: string
  badgeClass: string
  route: string
}

const lastRefreshedText = computed(() => {
  if (!lastRefreshed.value) return ''
  const h = lastRefreshed.value.getHours().toString().padStart(2, '0')
  const m = lastRefreshed.value.getMinutes().toString().padStart(2, '0')
  const s = lastRefreshed.value.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
})

const workflowEntries = computed<WorkflowEntry[]>(() => [
  {
    id: 'knowledge-qa',
    title: t('dashboard.workflowKnowledgeQaTitle', '企业知识问答'),
    description: t('dashboard.workflowKnowledgeQaSummary', '围绕企业文档与私有知识，快速完成带来源的问答。'),
    badge: t('dashboard.workflowEntryChatIm', '聊天 / IM'),
    badgeClass: 'hc-dash__badge--green',
    route: '/chat',
  },
  {
    id: 'attachment-qa',
    title: t('dashboard.workflowAttachmentQaTitle', '附件解析问答'),
    description: t('dashboard.workflowAttachmentQaSummary', '上传 PDF、Word 等材料后，直接在会话里提问和整理。'),
    badge: t('dashboard.workflowEntryChat', '聊天'),
    badgeClass: 'hc-dash__badge--green',
    route: '/chat',
  },
  {
    id: 'im-duty',
    title: t('dashboard.workflowImDutyTitle', 'IM 值班助手'),
    description: t('dashboard.workflowImDutySummary', '把飞书、钉钉等消息接进来，让智能体自动检索并回复。'),
    badge: t('dashboard.channels', 'IM 通道'),
    badgeClass: 'hc-dash__badge--purple',
    route: '/channels',
  },
  {
    id: 'multi-step-task',
    title: t('dashboard.multiStepTask', '多步骤任务自动执行'),
    description: t('dashboard.multiStepTaskSummary', '把研究、整理、生成这类任务交给自动化持续执行。'),
    badge: t('dashboard.orchestration', '编排'),
    badgeClass: 'hc-dash__badge--blue',
    route: '/automation',
  },
])

async function safeFetch<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn()
  } catch (e) {
    console.warn(`[Dashboard] ${label}:`, e)
    return null
  }
}

async function fetchStats() {
  try {
    const { apiGet } = await import('@/api/client')
    const res = await safeFetch(
      () => apiGet<Record<string, unknown>>('/api/v1/stats'),
      'stats',
    )
    if (res) {
      Object.assign(stats.value, res)
    }

    const { listSessions } = await import('@/api/chat')
    const sessionRes = await safeFetch(() => listSessions({ limit: 200 }), 'sessions')
    const sessions = sessionRes?.sessions || []
    stats.value.totalSessions = sessions.length
    const recent = sessions.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title || t('chat.newSessionDefault'),
      type: 'chat' as const,
      time: s.updated_at,
    }))
    recentActivity.value = recent

    const { getRoles } = await import('@/api/agents')
    const agentRes = await safeFetch(() => getRoles(), 'agents')
    stats.value.activeAgents = agentRes?.roles?.length || 0

    const { getMcpServers } = await import('@/api/mcp')
    const mcpRes = await safeFetch(() => getMcpServers(), 'mcp')
    stats.value.mcpServers = mcpRes?.servers?.length || 0

    const { getMemoryEntries } = await import('@/api/memory')
    const memRes = await safeFetch(() => getMemoryEntries({ view: 'all', limit: 1 }), 'memory')
    if (memRes) {
      stats.value.memoryEntries = memRes.total ?? memRes.entries.length
    }

    const { getDocuments } = await import('@/api/knowledge')
    const kRes = await safeFetch(() => getDocuments(), 'knowledge')
    stats.value.knowledgeDocs = kRes?.documents?.length || 0

    const { getIMInstances } = await import('@/api/im-channels')
    const imRes = await safeFetch(() => getIMInstances(), 'im-channels')
    stats.value.imChannels = imRes?.length || 0

    const { getLLMConfig } = await import('@/api/config')
    const llmRes = await safeFetch(() => getLLMConfig(), 'llm-config')
    stats.value.llmProviders = Object.keys(llmRes?.providers || {}).length
  } finally {
    // 从 Runtime 数据填充 tasksRunToday（替代硬编码 0）
    stats.value.tasksRunToday = runtime.completedTodayCount.value + runtime.failedTodayCount.value
    loading.value = false
    lastRefreshed.value = new Date()
    countdown.value = 30
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => fetchStats(), 30000)
  countdownTimer = setInterval(() => {
    countdown.value = Math.max(0, countdown.value - 1)
  }, 1000)
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function handleManualRefresh() {
  loading.value = true
  fetchStats()
  startAutoRefresh()
}

function formatActivityTime(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('dashboard.justNow')
    if (mins < 60) return t('dashboard.minutesAgo', { n: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('dashboard.hoursAgo', { n: hours })
    return t('dashboard.daysAgo', { n: Math.floor(hours / 24) })
  } catch { return '' }
}

onMounted(async () => {
  await fetchStats()
  startAutoRefresh()
})

onUnmounted(() => stopAutoRefresh())

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="hc-dash">
    <!-- Toolbar -->
    <PageToolbar>
      <template #tabs>
        <SegmentedControl v-model="dashTab" :segments="dashTabs" />
      </template>
      <template #actions>
        <button class="hc-btn hc-btn-ghost" @click="navigateTo('/chat')">
          {{ t('dashboard.newChat', 'New Chat') }}
        </button>
        <button
          class="hc-btn hc-btn-ghost"
          :disabled="loading"
          @click="handleManualRefresh"
        >
          <RefreshCw :size="14" :class="{ 'hc-spin-icon': loading }" />
        </button>
      </template>
    </PageToolbar>

    <!-- Header -->
    <PageHeader
      :eyebrow="t('dashboard.eyebrow', 'overview workspace')"
      :title="t('dashboard.heroTitle', 'Built for real tasks, not just chat')"
      :description="t('dashboard.heroDesc', 'A local-first AI agent desktop that unifies models, knowledge, MCP tools, and workflow orchestration.')"
      :status="appStore.sidecarReady ? t('dashboard.systemHealthy', 'System Healthy') : t('dashboard.systemDown', 'Disconnected')"
      :status-variant="appStore.sidecarReady ? 'success' : 'error'"
      :timestamp="lastRefreshedText ? `updated ${lastRefreshedText}` : undefined"
    />

    <!-- Content -->
    <div class="hc-dash__body">
      <!-- Stats Grid -->
      <div class="hc-dash__stats-grid">
        <div class="hc-dash__stat-card" @click="navigateTo('/chat')">
          <div class="hc-dash__stat-label">{{ t('dashboard.sessions', 'Sessions') }}</div>
          <div class="hc-dash__stat-value">{{ stats.totalSessions }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/settings')">
          <div class="hc-dash__stat-label">{{ t('dashboard.modelProviders', 'Model Providers') }}</div>
          <div class="hc-dash__stat-value">{{ stats.llmProviders }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/agents')">
          <div class="hc-dash__stat-label">{{ t('dashboard.activeAgents', 'Agents') }}</div>
          <div class="hc-dash__stat-value">{{ stats.activeAgents }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/channels')">
          <div class="hc-dash__stat-label">{{ t('dashboard.imChannelsMetric', 'IM Channels') }}</div>
          <div class="hc-dash__stat-value">{{ stats.imChannels }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/integration/mcp')">
          <div class="hc-dash__stat-label">{{ t('dashboard.mcpServers', 'MCP Servers') }}</div>
          <div class="hc-dash__stat-value">{{ stats.mcpServers }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/knowledge')">
          <div class="hc-dash__stat-label">{{ t('dashboard.knowledgeDocs', 'Knowledge') }}</div>
          <div class="hc-dash__stat-value">{{ stats.knowledgeDocs }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/knowledge/memory')">
          <div class="hc-dash__stat-label">{{ t('dashboard.memoryEntries', 'Memory') }}</div>
          <div class="hc-dash__stat-value">{{ stats.memoryEntries }}</div>
        </div>
        <div class="hc-dash__stat-card" @click="navigateTo('/automation')">
          <div class="hc-dash__stat-label">{{ t('dashboard.tasksToday', 'Tasks') }}</div>
          <div class="hc-dash__stat-value">{{ stats.tasksRunToday }}</div>
        </div>
      </div>

      <!-- Runtime Status Bar -->
      <div class="hc-dash__runtime-bar">
        <div class="hc-dash__runtime-item">
          <Activity :size="12" class="hc-dash__runtime-icon hc-dash__runtime-icon--active" />
          <span class="hc-dash__runtime-label">{{ t('dashboard.activeTasks', 'Active') }}</span>
          <span class="hc-dash__runtime-value">{{ runtimeStats.activeTasks }}</span>
        </div>
        <div class="hc-dash__runtime-item">
          <span class="hc-dash__runtime-dot hc-dash__runtime-dot--success" />
          <span class="hc-dash__runtime-label">{{ t('dashboard.completedToday', 'Completed') }}</span>
          <span class="hc-dash__runtime-value">{{ runtimeStats.completedToday }}</span>
        </div>
        <div class="hc-dash__runtime-item">
          <span class="hc-dash__runtime-dot hc-dash__runtime-dot--error" />
          <span class="hc-dash__runtime-label">{{ t('dashboard.failedToday', 'Failed') }}</span>
          <span class="hc-dash__runtime-value">{{ runtimeStats.failedToday }}</span>
        </div>
        <button
          class="hc-dash__runtime-link"
          @click="navigateTo('/runtime')"
        >
          {{ t('dashboard.viewRuntime', 'View Runtime') }}
          →
        </button>
      </div>

      <div class="hc-dash__grid-equal">
        <!-- Recent Activity -->
        <div class="hc-dash__card">
          <div class="hc-dash__card-body">
            <div class="hc-dash__card-title">{{ t('dashboard.recentActivity', 'Recent Activity') }}</div>
          </div>
          <div class="hc-dash__list">
            <template v-if="recentActivity.length > 0">
              <div
                v-for="item in recentActivity"
                :key="item.id"
                class="hc-dash__list-item"
                @click="navigateTo('/chat')"
              >
                <div>
                  <div class="hc-dash__list-title">{{ item.title }}</div>
                  <div class="hc-dash__list-desc">{{ formatActivityTime(item.time) }}</div>
                </div>
                <span class="hc-dash__badge hc-dash__badge--blue">{{ item.type }}</span>
              </div>
            </template>
            <div v-else class="hc-dash__empty">{{ t('dashboard.noActivity', 'No recent activity') }}</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="hc-dash__card hc-dash__card--workflows">
          <div class="hc-dash__card-body">
            <div class="hc-dash__card-title">{{ t('dashboard.realWorkflows', 'Quick Actions') }}</div>
          </div>
          <div class="hc-dash__list">
            <div
              v-for="entry in workflowEntries"
              :key="entry.id"
              class="hc-dash__list-item"
              @click="navigateTo(entry.route)"
            >
              <div>
                <div class="hc-dash__list-title">{{ entry.title }}</div>
                <div class="hc-dash__list-desc">{{ entry.description }}</div>
              </div>
              <span class="hc-dash__badge" :class="entry.badgeClass">{{ entry.badge }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Runtime Health + Events Row -->
      <div class="hc-dash__grid-equal">
        <RuntimeHealthCard :health="runtime.healthStatus.value" />
        <RuntimeEventsCard :events="runtime.recentEvents.value" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hc-dash {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hc-dash__body {
  flex: 1;
  overflow: hidden;
  padding: 0 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.hc-dash__stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex-shrink: 0;
}

.hc-dash__stat-card {
  background: var(--hc-bg-card);
  border: 1px solid var(--hc-border);
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.hc-dash__stat-card:hover {
  transform: translateY(-1px);
  background: var(--hc-accent-subtle);
}

.hc-dash__stat-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--hc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.hc-dash__stat-value {
  font-size: 22px;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-weight: 800;
  color: var(--hc-text-primary);
  margin-top: 2px;
}

.hc-dash__grid-equal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.hc-dash__grid-equal > .hc-dash__card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hc-dash__grid-equal > .hc-dash__card > .hc-dash__list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.hc-dash__card--workflows > .hc-dash__list {
  overflow: hidden;
}

/* ── Card ── */
.hc-dash__card {
  background: var(--hc-bg-card);
  border: 1px solid var(--hc-border);
  border-radius: 14px;
  box-shadow: var(--hc-shadow-sm);
  overflow: hidden;
}

.hc-dash__card-body {
  padding: 10px 14px;
}

.hc-dash__card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--hc-text-primary);
}

.hc-dash__card-desc {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--hc-text-muted);
}

/* ── List ── */
.hc-dash__list {
  padding: 4px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-dash__list-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.hc-dash__list-item:hover {
  transform: translateY(-1px);
  background: var(--hc-accent-subtle);
}

.hc-dash__list-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--hc-text-primary);
}

.hc-dash__list-desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--hc-text-muted);
}

.hc-dash__card--workflows .hc-dash__list {
  height: 100%;
  gap: 4px;
}

.hc-dash__card--workflows .hc-dash__list-item {
  flex: 1 1 0;
  min-height: 0;
  align-items: center;
  padding-top: 8px;
  padding-bottom: 8px;
}

.hc-dash__card--workflows .hc-dash__list-desc {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Badges ── */
.hc-dash__badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
  align-self: center;
}

.hc-dash__badge--blue {
  background: rgba(74, 144, 217, 0.12);
  color: var(--hc-accent);
}

.hc-dash__badge--green {
  background: rgba(50, 213, 131, 0.12);
  color: var(--hc-success);
}

.hc-dash__badge--amber {
  background: rgba(240, 180, 41, 0.12);
  color: var(--hc-warning);
}

.hc-dash__badge--purple {
  background: rgba(147, 51, 234, 0.12);
  color: var(--hc-accent);
}

/* ── Empty ── */
.hc-dash__empty {
  padding: 12px;
  text-align: center;
  font-size: 11px;
  color: var(--hc-text-muted);
}

/* ── Spin ── */
.hc-spin-icon {
  animation: hc-spin 1s linear infinite;
}

/* ── Runtime Status Bar ── */
.hc-dash__runtime-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: var(--hc-bg-card);
  border: 1px solid var(--hc-border);
  border-radius: 10px;
  flex-shrink: 0;
}

.hc-dash__runtime-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hc-dash__runtime-icon {
  color: var(--hc-text-muted);
}

.hc-dash__runtime-icon--active {
  color: var(--hc-accent);
}

.hc-dash__runtime-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.hc-dash__runtime-dot--success {
  background: var(--hc-success, #22c55e);
}

.hc-dash__runtime-dot--error {
  background: var(--hc-error, #ef4444);
}

.hc-dash__runtime-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--hc-text-muted);
}

.hc-dash__runtime-value {
  font-size: 13px;
  font-weight: 700;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: var(--hc-text-primary);
}

.hc-dash__runtime-link {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: var(--hc-accent);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.hc-dash__runtime-link:hover {
  opacity: 0.7;
}
</style>
