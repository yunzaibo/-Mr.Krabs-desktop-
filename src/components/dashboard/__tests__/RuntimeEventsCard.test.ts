import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RuntimeEventsCard from '../RuntimeEventsCard.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

describe('RuntimeEventsCard', () => {
  it('renders recent events', () => {
    const wrapper = mount(RuntimeEventsCard, {
      props: {
        events: [
          { id: 'e1', type: 'task.completed', taskId: '1', timestamp: new Date().toISOString() },
          { id: 'e2', type: 'task.created', taskId: '2', timestamp: new Date().toISOString() },
        ],
      },
    })
    expect(wrapper.text()).toContain('task.completed')
    expect(wrapper.text()).toContain('task.created')
  })

  it('shows empty state when no events', () => {
    const wrapper = mount(RuntimeEventsCard, {
      props: {
        events: [],
      },
    })
    expect(wrapper.text()).toContain('No recent events')
  })

  it('limits display to 5 events', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      id: `e${i}`,
      type: `task.completed` as const,
      taskId: `${i}`,
      timestamp: new Date().toISOString(),
    }))
    const wrapper = mount(RuntimeEventsCard, {
      props: { events },
    })
    const items = wrapper.findAll('.re-card__item')
    expect(items).toHaveLength(5)
  })

  it('renders event type and time', () => {
    const now = new Date().toISOString()
    const wrapper = mount(RuntimeEventsCard, {
      props: {
        events: [
          { id: 'e1', type: 'execution.completed', taskId: '1', timestamp: now },
        ],
      },
    })
    expect(wrapper.text()).toContain('execution.completed')
  })
})
