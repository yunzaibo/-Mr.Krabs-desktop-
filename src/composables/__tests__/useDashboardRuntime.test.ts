import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/stores/runtime', () => ({
  useRuntimeStore: vi.fn(),
}))

vi.mock('@/stores/tasks', () => ({
  useTaskStore: vi.fn(),
}))

describe('useDashboardRuntime', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('computes activeTaskCount from taskStore.activeCount', async () => {
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 3,
      activeTasks: [],
      completedTasks: [],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { activeTaskCount } = useDashboardRuntime()
    expect(activeTaskCount.value).toBe(3)
  })

  it('computes completedTodayCount for tasks completed today', async () => {
    const today = new Date().toISOString()
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 0,
      activeTasks: [],
      completedTasks: [
        { id: '1', status: 'completed', metadata: { completedAt: today } },
        { id: '2', status: 'completed', metadata: { completedAt: today } },
        { id: '3', status: 'completed', metadata: { completedAt: '2020-01-01T00:00:00Z' } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { completedTodayCount } = useDashboardRuntime()
    expect(completedTodayCount.value).toBe(2)
  })

  it('computes failedTodayCount for tasks failed today', async () => {
    const today = new Date().toISOString()
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 0,
      activeTasks: [],
      completedTasks: [
        { id: '1', status: 'failed', metadata: { completedAt: today } },
        { id: '2', status: 'completed', metadata: { completedAt: today } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { failedTodayCount } = useDashboardRuntime()
    expect(failedTodayCount.value).toBe(1)
  })

  it('returns healthy status when no failures', async () => {
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 2,
      activeTasks: [{ id: '1' }, { id: '2' }],
      completedTasks: [],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { healthStatus } = useDashboardRuntime()
    expect(healthStatus.value.overall).toBe('healthy')
    expect(healthStatus.value.activeTasks).toBe(2)
    expect(healthStatus.value.failedToday).toBe(0)
  })

  it('returns degraded status when failures exist', async () => {
    const today = new Date().toISOString()
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 1,
      activeTasks: [{ id: '1' }],
      completedTasks: [
        { id: '2', status: 'failed', metadata: { completedAt: today } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { healthStatus } = useDashboardRuntime()
    expect(healthStatus.value.overall).toBe('degraded')
  })

  it('returns error status when recovery fails', async () => {
    const today = new Date().toISOString()
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 1,
      activeTasks: [{ id: '1' }],
      completedTasks: [
        { id: '2', status: 'failed', metadata: { completedAt: today } },
        { id: '3', status: 'failed', metadata: { completedAt: today } },
        { id: '4', status: 'failed', metadata: { completedAt: today } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue({
        taskId: '1',
        resolution: 'failed',
      }),
    } as any)

    const { healthStatus } = useDashboardRuntime()
    expect(healthStatus.value.overall).toBe('error')
  })

  it('dashboardMetrics computes tasks per day for last 7 days', async () => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 0,
      activeTasks: [],
      completedTasks: [
        { id: '1', status: 'completed', metadata: { completedAt: `${todayStr}T10:00:00Z`, createdAt: `${todayStr}T09:58:00Z` } },
        { id: '2', status: 'completed', metadata: { completedAt: `${todayStr}T14:00:00Z`, createdAt: `${todayStr}T13:57:00Z` } },
        { id: '3', status: 'completed', metadata: { completedAt: `${yesterdayStr}T09:00:00Z`, createdAt: `${yesterdayStr}T08:59:00Z` } },
        { id: '4', status: 'failed', metadata: { completedAt: `${todayStr}T11:00:00Z` } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { dashboardMetrics } = useDashboardRuntime()
    const metrics = dashboardMetrics.value

    expect(metrics.tasksPerDay).toHaveLength(7)
    expect(metrics.tasksPerDay[6]!.date).toBe(todayStr)
    expect(metrics.tasksPerDay[6]!.completed).toBe(2)
    expect(metrics.tasksPerDay[6]!.failed).toBe(1)

    const yesterdayEntry = metrics.tasksPerDay.find(d => d.date === yesterdayStr)
    expect(yesterdayEntry).toBeDefined()
    expect(yesterdayEntry!.completed).toBe(1)
    expect(yesterdayEntry!.failed).toBe(0)
  })

  it('dashboardMetrics computes average completion time', async () => {
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 0,
      activeTasks: [],
      completedTasks: [
        { id: '1', status: 'completed', metadata: { completedAt: '2026-05-19T10:01:40Z', createdAt: '2026-05-19T10:00:00Z' } },
        { id: '2', status: 'completed', metadata: { completedAt: '2026-05-19T10:03:20Z', createdAt: '2026-05-19T10:00:00Z' } },
        { id: '3', status: 'completed', metadata: { completedAt: '2026-05-19T10:05:00Z', createdAt: '2026-05-19T10:00:00Z' } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { dashboardMetrics } = useDashboardRuntime()
    const metrics = dashboardMetrics.value

    // (100 + 200 + 300) / 3 = 200
    expect(metrics.avgCompletionTime).toBe(200)
  })

  it('dashboardMetrics computes failure rate', async () => {
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 0,
      activeTasks: [],
      completedTasks: [
        { id: '1', status: 'completed', metadata: { completedAt: '2026-05-19T10:01:40Z', createdAt: '2026-05-19T10:00:00Z' } },
        { id: '2', status: 'completed', metadata: { completedAt: '2026-05-19T10:03:20Z', createdAt: '2026-05-19T10:00:00Z' } },
        { id: '3', status: 'failed', metadata: { completedAt: '2026-05-19T11:00:00Z' } },
        { id: '4', status: 'failed', metadata: { completedAt: '2026-05-19T12:00:00Z' } },
      ],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { dashboardMetrics } = useDashboardRuntime()
    const metrics = dashboardMetrics.value

    // 2 failed / 4 total = 50%
    expect(metrics.failureRate).toBe(50)
    expect(metrics.totalTasks).toBe(4)
  })

  it('dashboardMetrics handles empty task list', async () => {
    const { useTaskStore } = await import('@/stores/tasks')
    const { useRuntimeStore } = await import('@/stores/runtime')
    const { useDashboardRuntime } = await import('../useDashboardRuntime')

    vi.mocked(useTaskStore).mockReturnValue({
      activeCount: 0,
      activeTasks: [],
      completedTasks: [],
      failedTasks: [],
    } as any)

    vi.mocked(useRuntimeStore).mockReturnValue({
      getRecentEvents: vi.fn().mockReturnValue([]),
      contextSummaries: [],
      getRecoverySummary: vi.fn().mockReturnValue(null),
    } as any)

    const { dashboardMetrics } = useDashboardRuntime()
    const metrics = dashboardMetrics.value

    expect(metrics.tasksPerDay).toHaveLength(7)
    expect(metrics.tasksPerDay.every(d => d.completed === 0 && d.failed === 0)).toBe(true)
    expect(metrics.avgCompletionTime).toBe(0)
    expect(metrics.failureRate).toBe(0)
    expect(metrics.totalTasks).toBe(0)
  })
})
