import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/stores/runtime', () => ({
  useRuntimeStore: vi.fn(),
}))

vi.mock('@/stores/tasks', () => ({
  useTaskStore: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn().mockReturnValue({ query: {} }),
  onBeforeRouteUpdate: vi.fn(),
}))

function makeTimelineItem(overrides: Record<string, any> = {}) {
  return {
    time: '12:00:00',
    typeCategory: 'task',
    typeLabel: 'workspace.timeline.task.created',
    summary: 'test event',
    ...overrides,
  }
}

describe('useWorkspace', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('filteredTimelineProjection', () => {
    it('returns all events when filter is all', async () => {
      const { useTaskStore } = await import('@/stores/tasks')
      const { useRuntimeStore } = await import('@/stores/runtime')
      const { useWorkspace } = await import('../useWorkspace')

      vi.mocked(useTaskStore).mockReturnValue({
        activeTasks: [],
        completedTasks: [],
        activeCount: 0,
        getTask: vi.fn().mockReturnValue(null),
      } as any)

      const items = [
        makeTimelineItem({ type: 'task.created' }),
        makeTimelineItem({ type: 'context.created' }),
        makeTimelineItem({ type: 'skill.loaded' }),
      ]

      vi.mocked(useRuntimeStore).mockReturnValue({
        getContextSummary: vi.fn().mockReturnValue(null),
        getActiveContext: vi.fn().mockReturnValue(null),
        getTaskTimeline: vi.fn().mockReturnValue(items),
        getRecoverySummary: vi.fn().mockReturnValue(null),
        getResolutionState: vi.fn().mockReturnValue(null),
        detectCorruption: vi.fn().mockReturnValue(null),
      } as any)

      const { filteredTimelineProjection, selectTask } = useWorkspace()
      selectTask('task-1')

      // filter defaults to 'all', should return all 3
      expect(filteredTimelineProjection.value).toHaveLength(3)
    })

    it('filters by category', async () => {
      const { useTaskStore } = await import('@/stores/tasks')
      const { useRuntimeStore } = await import('@/stores/runtime')
      const { useWorkspace } = await import('../useWorkspace')

      vi.mocked(useTaskStore).mockReturnValue({
        activeTasks: [],
        completedTasks: [],
        activeCount: 0,
        getTask: vi.fn().mockReturnValue(null),
      } as any)

      const items = [
        makeTimelineItem({ type: 'task.created' }),
        makeTimelineItem({ type: 'task.completed' }),
        makeTimelineItem({ type: 'context.created' }),
        makeTimelineItem({ type: 'skill.loaded' }),
        makeTimelineItem({ type: 'recovery.assessed' }),
      ]

      vi.mocked(useRuntimeStore).mockReturnValue({
        getContextSummary: vi.fn().mockReturnValue(null),
        getActiveContext: vi.fn().mockReturnValue(null),
        getTaskTimeline: vi.fn().mockReturnValue(items),
        getRecoverySummary: vi.fn().mockReturnValue(null),
        getResolutionState: vi.fn().mockReturnValue(null),
        detectCorruption: vi.fn().mockReturnValue(null),
      } as any)

      const { filteredTimelineProjection, timelineFilter, selectTask } = useWorkspace()
      selectTask('task-1')

      // filter to task only
      timelineFilter.value = 'task'
      expect(filteredTimelineProjection.value).toHaveLength(2)

      // filter to context only
      timelineFilter.value = 'context'
      expect(filteredTimelineProjection.value).toHaveLength(1)

      // filter to skill only
      timelineFilter.value = 'skill'
      expect(filteredTimelineProjection.value).toHaveLength(1)

      // filter to recovery only
      timelineFilter.value = 'recovery'
      expect(filteredTimelineProjection.value).toHaveLength(1)
    })

    it('limits to 200 events', async () => {
      const { useTaskStore } = await import('@/stores/tasks')
      const { useRuntimeStore } = await import('@/stores/runtime')
      const { useWorkspace } = await import('../useWorkspace')

      vi.mocked(useTaskStore).mockReturnValue({
        activeTasks: [],
        completedTasks: [],
        activeCount: 0,
        getTask: vi.fn().mockReturnValue(null),
      } as any)

      // create 250 items with type 'task.created'
      const items = Array.from({ length: 250 }, (_, i) =>
        makeTimelineItem({ type: 'task.created', summary: `event ${i}` }),
      )

      vi.mocked(useRuntimeStore).mockReturnValue({
        getContextSummary: vi.fn().mockReturnValue(null),
        getActiveContext: vi.fn().mockReturnValue(null),
        getTaskTimeline: vi.fn().mockReturnValue(items),
        getRecoverySummary: vi.fn().mockReturnValue(null),
        getResolutionState: vi.fn().mockReturnValue(null),
        detectCorruption: vi.fn().mockReturnValue(null),
      } as any)

      const { filteredTimelineProjection, selectTask } = useWorkspace()
      selectTask('task-1')

      // all filter: should cap at 200
      expect(filteredTimelineProjection.value).toHaveLength(200)
    })
  })
})
