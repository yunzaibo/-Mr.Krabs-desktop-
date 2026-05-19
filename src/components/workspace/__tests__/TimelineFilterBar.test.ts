import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineFilterBar from '../TimelineFilterBar.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const defaultCounts = {
  all: 12,
  task: 5,
  context: 3,
  skill: 2,
  recovery: 2,
}

function mountBar(props: Record<string, unknown> = {}) {
  return mount(TimelineFilterBar, {
    props: {
      filter: 'all',
      eventCounts: defaultCounts,
      ...props,
    },
  })
}

describe('TimelineFilterBar', () => {
  it('renders all 5 filter chips', () => {
    const wrapper = mountBar()
    const chips = wrapper.findAll('.hc-filter-chip')
    expect(chips).toHaveLength(5)
    expect(wrapper.text()).toContain('All')
    expect(wrapper.text()).toContain('Task')
    expect(wrapper.text()).toContain('Context')
    expect(wrapper.text()).toContain('Skill')
    expect(wrapper.text()).toContain('Recovery')
  })

  it('displays event counts in badges', () => {
    const wrapper = mountBar()
    const badges = wrapper.findAll('.hc-filter-chip__badge')
    expect(badges).toHaveLength(5)
    expect(badges[0]!.text()).toBe('12')
    expect(badges[1]!.text()).toBe('5')
    expect(badges[2]!.text()).toBe('3')
    expect(badges[3]!.text()).toBe('2')
    expect(badges[4]!.text()).toBe('2')
  })

  it('emits update:filter when chip clicked', async () => {
    const wrapper = mountBar()
    const chips = wrapper.findAll('.hc-filter-chip')
    await chips[1]!.trigger('click')
    expect(wrapper.emitted('update:filter')).toHaveLength(1)
    expect(wrapper.emitted('update:filter')![0]).toEqual(['task'])
  })

  it('highlights active filter chip', () => {
    const wrapper = mountBar({ filter: 'skill' })
    const chips = wrapper.findAll('.hc-filter-chip')
    // skill is index 3
    expect(chips[3]!.classes()).toContain('hc-filter-chip--active')
    // all is not active
    expect(chips[0]!.classes()).not.toContain('hc-filter-chip--active')
  })

  it('hides count badge when count is 0', () => {
    const counts = {
      all: 0,
      task: 0,
      context: 0,
      skill: 0,
      recovery: 0,
    }
    const wrapper = mountBar({ eventCounts: counts })
    const badges = wrapper.findAll('.hc-filter-chip__badge')
    expect(badges).toHaveLength(0)
  })
})
