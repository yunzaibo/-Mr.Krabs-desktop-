import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelinePanel from '../TimelinePanel.vue'
import type { TimelineItemProjection, TimelineNarrativeGroup } from '@/types/workspace'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const defaultCounts = {
  all: 10,
  task: 4,
  context: 3,
  skill: 2,
  recovery: 1,
}

const baseItem: TimelineItemProjection = {
  time: '12:00:00',
  typeCategory: 'task',
  typeLabel: 'task.created',
  summary: 'Task was created',
}

const baseGroup: TimelineNarrativeGroup = {
  id: 'grp-1',
  phase: 'creation',
  title: 'Task Created',
  description: 'A new task was initialized',
  startTime: '2026-05-19T12:00:00Z',
  durationMs: 1200,
  eventCount: 3,
  isCollapsed: false,
  children: [],
}

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(TimelinePanel, {
    props: {
      items: [baseItem],
      narrativeItems: [baseGroup],
      taskId: 'task-1',
      ...props,
    },
  })
}

describe('TimelinePanel', () => {
  it('renders filter bar when showFilter prop is true', () => {
    const wrapper = mountPanel({
      showFilter: true,
      currentFilter: 'all',
      eventCounts: defaultCounts,
    })
    expect(wrapper.find('.hc-filter-bar').exists()).toBe(true)
    expect(wrapper.findAll('.hc-filter-chip')).toHaveLength(5)
  })

  it('hides filter bar when showFilter prop is false', () => {
    const wrapper = mountPanel({ showFilter: false })
    expect(wrapper.find('.hc-filter-bar').exists()).toBe(false)
  })

  it('expands event detail on click', async () => {
    const wrapper = mountPanel({
      viewMode: 'raw',
      items: [
        { ...baseItem, id: 'evt-1' },
      ],
    })

    // Switch to raw view
    const rawBtn = wrapper.findAll('.timeline-panel__toggle-btn')[1]!
    await rawBtn.trigger('click')

    // Initially no expanded detail
    expect(wrapper.find('.hc-event-detail').exists()).toBe(false)

    // Click the event row
    const row = wrapper.find('.timeline-event-row')
    expect(row.exists()).toBe(true)
    await row.trigger('click')

    // Detail should appear (if event data provided)
    // Without event prop, TimelineEventDetail won't render
    // So this validates the click handler toggles expandedEventId
    expect(wrapper.find('.timeline-event-row--expanded').exists()).toBe(true)

    // Click again to collapse
    await row.trigger('click')
    expect(wrapper.find('.timeline-event-row--expanded').exists()).toBe(false)
  })
})
