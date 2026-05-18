import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RuntimeHealthCard from '../RuntimeHealthCard.vue'

const mockSidecarReady = vi.fn().mockReturnValue(true)

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    get sidecarReady() { return mockSidecarReady() },
  }),
}))

describe('RuntimeHealthCard', () => {
  it('renders healthy status', () => {
    mockSidecarReady.mockReturnValue(true)
    const wrapper = mount(RuntimeHealthCard, {
      props: {
        health: {
          overall: 'healthy',
          activeTasks: 2,
          failedToday: 0,
          recoveries: [],
        },
      },
    })
    expect(wrapper.text()).toContain('Healthy')
    expect(wrapper.text()).toContain('2')
  })

  it('renders degraded status', () => {
    mockSidecarReady.mockReturnValue(true)
    const wrapper = mount(RuntimeHealthCard, {
      props: {
        health: {
          overall: 'degraded',
          activeTasks: 1,
          failedToday: 1,
          recoveries: [],
        },
      },
    })
    expect(wrapper.text()).toContain('Degraded')
    expect(wrapper.text()).toContain('1')
  })

  it('renders error status with recovery count', () => {
    mockSidecarReady.mockReturnValue(true)
    const wrapper = mount(RuntimeHealthCard, {
      props: {
        health: {
          overall: 'error',
          activeTasks: 0,
          failedToday: 3,
          recoveries: [
            { taskId: '1', resolution: 'failed' },
            { taskId: '2', resolution: 'pending' },
          ],
        },
      },
    })
    expect(wrapper.text()).toContain('Error')
    expect(wrapper.text()).toContain('Recoveries')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('1 failed')
  })

  it('does not show recoveries section when none exist', () => {
    mockSidecarReady.mockReturnValue(true)
    const wrapper = mount(RuntimeHealthCard, {
      props: {
        health: {
          overall: 'healthy',
          activeTasks: 0,
          failedToday: 0,
          recoveries: [],
        },
      },
    })
    expect(wrapper.text()).not.toContain('Recoveries')
  })

  it('shows disconnected when sidecar is not ready', () => {
    mockSidecarReady.mockReturnValue(false)
    const wrapper = mount(RuntimeHealthCard, {
      props: {
        health: {
          overall: 'healthy',
          activeTasks: 0,
          failedToday: 0,
          recoveries: [],
        },
      },
    })
    expect(wrapper.text()).toContain('Disconnected')
  })
})
