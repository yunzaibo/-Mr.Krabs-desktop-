import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RecoveryActionPanel from '../RecoveryActionPanel.vue'
import type { RecoverySummary } from '@/types/recovery'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      workspace: {
        recovery: {
          title: 'Recovery',
          tryAgain: '重试',
          resetContext: '重置上下文',
          dismiss: '忽略',
          lastChecked: '上次检查',
          recoverable: '可恢复',
          unrecoverable: '不可恢复',
          corrupted: '已损坏',
          confirmReset: '确定要重置上下文吗？这将清除所有恢复状态。',
          confirmDismiss: '确定要忽略此失败吗？',
        },
      },
    },
  },
})

function createSummary(overrides: Partial<RecoverySummary> = {}): RecoverySummary {
  return {
    taskId: 'task-1',
    failureType: 'transient',
    assessmentState: 'recoverable',
    resolution: 'pending',
    ...overrides,
  }
}

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(RecoveryActionPanel, {
    props: {
      assessment: createSummary(),
      resolutionState: 'pending',
      ...props,
    },
    global: { plugins: [i18n] },
  })
}

describe('RecoveryActionPanel', () => {
  it('renders nothing when assessment is null', () => {
    const wrapper = mountPanel({ assessment: null })
    expect(wrapper.find('.recovery-panel').exists()).toBe(false)
  })

  it('shows recovery title and status badge', () => {
    const wrapper = mountPanel()
    expect(wrapper.text()).toContain('Recovery')
    expect(wrapper.find('.recovery-panel__badge').exists()).toBe(true)
  })

  it('shows "Try again" button when assessment is recoverable', () => {
    const wrapper = mountPanel({
      assessment: createSummary({ assessmentState: 'recoverable' }),
    })
    const retryBtn = wrapper.find('.recovery-panel__btn--primary')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toContain('重试')
  })

  it('shows "Reset Context" button when resolution is failed', () => {
    const wrapper = mountPanel({
      assessment: createSummary({ assessmentState: 'unrecoverable' }),
      resolutionState: 'failed',
    })
    const resetBtn = wrapper.find('.recovery-panel__btn--secondary')
    expect(resetBtn.exists()).toBe(true)
    expect(resetBtn.text()).toContain('重置上下文')
  })

  it('emits retry event on retry button click', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.recovery-panel__btn--primary').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('emits cleanRestart event on reset button click with confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mountPanel({
      assessment: createSummary({ assessmentState: 'unrecoverable' }),
      resolutionState: 'failed',
    })
    await wrapper.find('.recovery-panel__btn--secondary').trigger('click')
    expect(window.confirm).toHaveBeenCalled()
    expect(wrapper.emitted('cleanRestart')).toBeTruthy()
    vi.restoreAllMocks()
  })

  it('does not emit cleanRestart when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mountPanel({
      assessment: createSummary({ assessmentState: 'unrecoverable' }),
      resolutionState: 'failed',
    })
    await wrapper.find('.recovery-panel__btn--secondary').trigger('click')
    expect(wrapper.emitted('cleanRestart')).toBeFalsy()
    vi.restoreAllMocks()
  })

  it('disables buttons when isExecuting is true', () => {
    const wrapper = mountPanel({ isExecuting: true })
    const buttons = wrapper.findAll('button')
    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  it('has correct aria attributes', () => {
    const wrapper = mountPanel()
    const panel = wrapper.find('[role="region"]')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('aria-label')).toContain('Recovery')
  })
})
