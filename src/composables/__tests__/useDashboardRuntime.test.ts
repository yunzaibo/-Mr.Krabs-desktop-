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
})
