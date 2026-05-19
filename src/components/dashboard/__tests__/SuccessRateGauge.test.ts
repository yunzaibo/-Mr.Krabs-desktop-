import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SuccessRateGauge from '../SuccessRateGauge.vue'

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }
})

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en' })

function createWrapper(rate: number, total = 100) {
  return mount(SuccessRateGauge, {
    props: { rate, total },
    global: { plugins: [i18n] },
  })
}

describe('SuccessRateGauge', () => {
  it('renders gauge with percentage', () => {
    const wrapper = createWrapper(92)
    expect(wrapper.text()).toContain('92%')
  })

  it('applies success class for rate >= 95%', () => {
    const wrapper = createWrapper(95)
    expect(wrapper.classes()).toContain('hc-gauge--success')
  })

  it('applies warning class for rate 85-94%', () => {
    const wrapper = createWrapper(88)
    expect(wrapper.classes()).toContain('hc-gauge--warning')
  })

  it('applies error class for rate < 85%', () => {
    const wrapper = createWrapper(72)
    expect(wrapper.classes()).toContain('hc-gauge--error')
  })

  it('displays total tasks', () => {
    const wrapper = createWrapper(90, 256)
    expect(wrapper.text()).toContain('256 tasks')
  })
})
