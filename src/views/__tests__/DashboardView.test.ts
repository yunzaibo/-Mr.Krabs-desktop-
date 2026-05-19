import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DashboardView from '../DashboardView.vue'

// ── Mocks ────────────────────────────────────────────────────────────
const runtime = vi.hoisted(() => ({
  activeTaskCount: { value: 0 },
  completedTodayCount: { value: 0 },
  failedTodayCount: { value: 0 },
  recentEvents: { value: [] },
  healthStatus: { value: { overall: 'healthy', activeTasks: 0, failedToday: 0, recoveries: [] } },
  dashboardMetrics: {
    value: {
      tasksPerDay: [
        { date: '2026-05-13', completed: 2, failed: 0 },
        { date: '2026-05-14', completed: 3, failed: 1 },
        { date: '2026-05-15', completed: 1, failed: 0 },
        { date: '2026-05-16', completed: 4, failed: 0 },
        { date: '2026-05-17', completed: 2, failed: 1 },
        { date: '2026-05-18', completed: 5, failed: 0 },
        { date: '2026-05-19', completed: 0, failed: 0 },
      ],
      avgCompletionTime: 30,
      failureRate: 12,
      totalTasks: 19,
    },
  },
}))

vi.mock('@/composables/useDashboardRuntime', () => ({
  useDashboardRuntime: () => runtime,
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    sidecarReady: true,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }
})

vi.mock('lucide-vue-next', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  const stub = { template: '<span />' }
  const mocked: Record<string, unknown> = {}
  for (const key of Object.keys(original)) mocked[key] = stub
  return mocked
})

vi.mock('@/components/dashboard/DashboardStatsChart.vue', () => ({
  default: {
    name: 'DashboardStatsChart',
    template: '<div class="mock-dsc">Analytics</div>',
    props: ['metrics'],
  },
}))

vi.mock('@/components/dashboard/RuntimeHealthCard.vue', () => ({
  default: { name: 'RuntimeHealthCard', template: '<div class="mock-rhc" />', props: ['health'] },
}))

vi.mock('@/components/dashboard/RuntimeEventsCard.vue', () => ({
  default: { name: 'RuntimeEventsCard', template: '<div class="mock-rec" />', props: ['events'] },
}))

vi.mock('@/components/common/PageToolbar.vue', () => ({
  default: { name: 'PageToolbar', template: '<div class="mock-toolbar"><slot /></div>' },
}))

vi.mock('@/components/common/PageHeader.vue', () => ({
  default: { name: 'PageHeader', template: '<div class="mock-header" />', props: ['eyebrow', 'title', 'description', 'status', 'statusVariant', 'timestamp'] },
}))

vi.mock('@/components/common/SegmentedControl.vue', () => ({
  default: { name: 'SegmentedControl', template: '<div class="mock-seg" />', props: ['modelValue', 'segments'] },
}))

// Mock ofetch and env to prevent RPC errors in test environment
vi.mock('ofetch', () => ({
  ofetch: { create: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({})) },
}))
vi.mock('@/config/env', () => ({
  env: { API_BASE_URL: 'http://localhost:16060', apiBase: 'http://localhost:16060', timeout: 30000 },
}))

// Mock API calls so fetchStats doesn't fail.
// These mocks intercept both static imports AND dynamic import() calls in fetchStats(),
// preventing Vite RPC module resolution that causes flaky test failures in parallel execution.
vi.mock('@/api/client', () => ({
  apiGet: vi.fn().mockResolvedValue({}),
  apiSSE: vi.fn().mockResolvedValue(new ReadableStream()),
  checkHealth: vi.fn().mockResolvedValue(true),
  api: { get: vi.fn().mockResolvedValue({}), post: vi.fn().mockResolvedValue({}) },
  fromNativeError: vi.fn(),
  createApiError: vi.fn(),
  isRetryable: vi.fn(),
  getErrorMessage: vi.fn(),
}))
vi.mock('@/api/chat', () => ({ listSessions: vi.fn().mockResolvedValue({ sessions: [] }) }))
vi.mock('@/api/agents', () => ({ getRoles: vi.fn().mockResolvedValue({ roles: [] }) }))
vi.mock('@/api/mcp', () => ({ getMcpServers: vi.fn().mockResolvedValue({ servers: [] }) }))
vi.mock('@/api/memory', () => ({ getMemoryEntries: vi.fn().mockResolvedValue({ entries: [], total: 0 }) }))
vi.mock('@/api/knowledge', () => ({ getDocuments: vi.fn().mockResolvedValue({ documents: [] }) }))
vi.mock('@/api/im-channels', () => ({ getIMInstances: vi.fn().mockResolvedValue([]) }))
vi.mock('@/api/config', () => ({ getLLMConfig: vi.fn().mockResolvedValue({ providers: {} }) }))

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
  })
}

function mountDashboard() {
  return mount(DashboardView, {
    attachTo: document.body,
    global: {
      plugins: [createTestI18n()],
      stubs: { teleport: true, transition: false },
    },
  })
}

describe('DashboardView', () => {
  let wrapper: ReturnType<typeof mountDashboard> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('renders Analytics section', async () => {
    wrapper = mountDashboard()
    await wrapper.vm.$nextTick()

    const analytics = wrapper.find('.hc-dash__analytics')
    expect(analytics.exists()).toBe(true)
  })

  it('renders DashboardStatsChart component', async () => {
    wrapper = mountDashboard()
    await wrapper.vm.$nextTick()

    const chart = wrapper.find('.mock-dsc')
    expect(chart.exists()).toBe(true)
    expect(chart.text()).toContain('Analytics')
  })
})
