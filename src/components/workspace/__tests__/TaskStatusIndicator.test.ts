import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TaskStatusIndicator from '../TaskStatusIndicator.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      workspace: {
        status: {
          running: '运行中',
          pending: '等待中',
          completed: '已完成',
          failed: '失败',
          cancelled: '已取消',
        },
      },
    },
  },
})

function mountIndicator(props: Record<string, unknown> = {}) {
  return mount(TaskStatusIndicator, {
    props: { status: 'running', ...props },
    global: { plugins: [i18n] },
  })
}

describe('TaskStatusIndicator', () => {
  it('renders pulse dot when status is running', () => {
    const wrapper = mountIndicator({ status: 'running' })
    const dot = wrapper.find('.hc-live-pulse')
    expect(dot.exists()).toBe(true)
    expect(dot.classes()).not.toContain('hc-live-pulse--muted')
  })

  it('renders muted dot when status is completed', () => {
    const wrapper = mountIndicator({ status: 'completed' })
    const dot = wrapper.find('.hc-live-pulse')
    expect(dot.exists()).toBe(true)
    expect(dot.classes()).toContain('hc-live-pulse--muted')
  })

  it('renders error dot when status is failed', () => {
    const wrapper = mountIndicator({ status: 'failed' })
    const dot = wrapper.find('.hc-live-pulse')
    expect(dot.exists()).toBe(true)
    expect(dot.classes()).toContain('hc-live-pulse--error')
  })

  it('shows status label text', () => {
    const wrapper = mountIndicator({ status: 'running' })
    expect(wrapper.text()).toContain('运行中')
  })

  it('shows elapsed time when provided and status is running', () => {
    const wrapper = mountIndicator({ status: 'running', elapsed: 42 })
    expect(wrapper.text()).toContain('42s')
  })

  it('displays string elapsed directly from projection', () => {
    const wrapper = mountIndicator({ status: 'running', elapsed: '3m 15s' })
    expect(wrapper.text()).toContain('3m 15s')
  })

  it('hides elapsed time when status is not running', () => {
    const wrapper = mountIndicator({ status: 'completed', elapsed: 42 })
    expect(wrapper.text()).not.toContain('42s')
  })

  it('has correct aria attributes', () => {
    const wrapper = mountIndicator({ status: 'running' })
    const container = wrapper.find('[role="status"]')
    expect(container.exists()).toBe(true)
    expect(container.attributes('aria-live')).toBe('polite')
  })
})
