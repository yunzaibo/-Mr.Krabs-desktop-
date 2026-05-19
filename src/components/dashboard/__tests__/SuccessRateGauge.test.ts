import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SuccessRateGauge from '../SuccessRateGauge.vue'

function createWrapper(rate: number, total = 100) {
  return mount(SuccessRateGauge, { props: { rate, total } })
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
