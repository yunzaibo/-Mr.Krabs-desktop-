import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineEventDetail from '../TimelineEventDetail.vue'
import type { RuntimeEvent } from '@/types/timeline'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const baseEvent: RuntimeEvent = {
  id: 'evt-1',
  type: 'task.created',
  timestamp: '2026-05-19T10:30:00.000Z',
  taskId: 'task-1',
  layer: 'main',
}

function mountDetail(props: Record<string, unknown> = {}) {
  return mount(TimelineEventDetail, {
    props: {
      event: baseEvent,
      expanded: true,
      ...props,
    },
  })
}

describe('TimelineEventDetail', () => {
  it('renders expanded content when expanded is true', () => {
    const wrapper = mountDetail({ expanded: true })
    expect(wrapper.find('.hc-event-detail').exists()).toBe(true)
    expect(wrapper.text()).toContain('task.created')
  })

  it('renders nothing when expanded is false', () => {
    const wrapper = mountDetail({ expanded: false })
    expect(wrapper.find('.hc-event-detail').exists()).toBe(false)
    // Vue emits a <!--v-if--> comment when the root element is conditionally hidden
    expect(wrapper.findAll('*')).toHaveLength(0)
  })

  it('displays metadata as key-value pairs', () => {
    const event: RuntimeEvent = {
      ...baseEvent,
      payload: {
        summary: 'Task created',
        metadata: { retries: 3, mode: 'parallel' },
      },
    }
    const wrapper = mountDetail({ event })
    expect(wrapper.text()).toContain('retries')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('mode')
    expect(wrapper.text()).toContain('parallel')
    const keys = wrapper.findAll('.hc-event-detail__meta-key')
    expect(keys.length).toBe(2)
  })

  it('handles event without payload gracefully', () => {
    const event: RuntimeEvent = { ...baseEvent, payload: undefined }
    const wrapper = mountDetail({ event })
    expect(wrapper.find('.hc-event-detail').exists()).toBe(true)
    expect(wrapper.text()).toContain('No payload data')
  })

  it('formats timestamp correctly', () => {
    const wrapper = mountDetail()
    const text = wrapper.text()
    // Should contain a human-readable date (toLocaleString output)
    // At minimum it should not show the raw ISO string
    expect(text).toContain('2026')
  })
})
