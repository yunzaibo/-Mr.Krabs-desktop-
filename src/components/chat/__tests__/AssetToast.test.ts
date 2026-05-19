import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetToast from '../AssetToast.vue'

describe('AssetToast', () => {
  it('renders success toast', () => {
    const wrapper = mount(AssetToast, {
      props: { message: 'Saved successfully', variant: 'success' },
    })
    expect(wrapper.find('.toast--success').exists()).toBe(true)
    expect(wrapper.text()).toContain('Saved successfully')
  })

  it('renders error toast', () => {
    const wrapper = mount(AssetToast, {
      props: { message: 'Save failed', variant: 'error' },
    })
    expect(wrapper.find('.toast--error').exists()).toBe(true)
  })

  it('renders warning toast', () => {
    const wrapper = mount(AssetToast, {
      props: { message: 'Disk space low', variant: 'warning' },
    })
    expect(wrapper.find('.toast--warning').exists()).toBe(true)
  })

  it('emits dismiss on close click', async () => {
    const wrapper = mount(AssetToast, {
      props: { message: 'Test', variant: 'info' },
    })
    await wrapper.find('.toast__close').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })
})
