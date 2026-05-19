import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardStatsChart from '../DashboardStatsChart.vue'
import type { DashboardMetrics } from '@/composables/useDashboardRuntime'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

vi.mock('vue-chartjs', () => ({
  Line: { template: '<div class="mock-line-chart" />' },
}))

const baseMetrics: DashboardMetrics = {
  tasksPerDay: [
    { date: 'Mon', completed: 5, failed: 1 },
    { date: 'Tue', completed: 3, failed: 0 },
    { date: 'Wed', completed: 7, failed: 2 },
    { date: 'Thu', completed: 4, failed: 0 },
    { date: 'Fri', completed: 6, failed: 1 },
    { date: 'Sat', completed: 2, failed: 0 },
    { date: 'Sun', completed: 3, failed: 0 },
  ],
  avgCompletionTime: 45,
  failureRate: 8,
  totalTasks: 38,
}

describe('DashboardStatsChart', () => {
  it('renders analytics section header', () => {
    const wrapper = mount(DashboardStatsChart, { props: { metrics: baseMetrics } })
    expect(wrapper.text()).toContain('Analytics')
  })

  it('renders line chart', () => {
    const wrapper = mount(DashboardStatsChart, { props: { metrics: baseMetrics } })
    expect(wrapper.find('.mock-line-chart').exists()).toBe(true)
  })

  it('displays avg completion time', () => {
    const wrapper = mount(DashboardStatsChart, { props: { metrics: baseMetrics } })
    expect(wrapper.text()).toContain('45s')
  })

  it('displays failure rate with color coding', () => {
    // 8% failure rate → warning (yellow) since 5 <= 8 < 15
    const wrapper = mount(DashboardStatsChart, { props: { metrics: baseMetrics } })
    const rateEl = wrapper.find('.dsc-metric__value.dsc-metric--warning')
    expect(rateEl.exists()).toBe(true)
    expect(rateEl.text()).toContain('8%')
  })

  it('displays total tasks', () => {
    const wrapper = mount(DashboardStatsChart, { props: { metrics: baseMetrics } })
    expect(wrapper.text()).toContain('38')
  })

  it('shows empty state when no tasks', () => {
    const emptyMetrics: DashboardMetrics = {
      tasksPerDay: [],
      avgCompletionTime: 0,
      failureRate: 0,
      totalTasks: 0,
    }
    const wrapper = mount(DashboardStatsChart, { props: { metrics: emptyMetrics } })
    expect(wrapper.text()).toContain('No tasks in the last 7 days')
    expect(wrapper.find('.mock-line-chart').exists()).toBe(false)
  })
})
