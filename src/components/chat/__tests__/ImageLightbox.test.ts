import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageLightbox from '../ImageLightbox.vue'

describe('ImageLightbox', () => {
  const defaultProps = {
    isOpen: true,
    currentAssetId: 'img-1',
    currentUrl: 'https://example.com/photo.png',
    currentIndex: 0,
    totalCount: 3,
  }

  it('renders when isOpen is true', () => {
    const wrapper = mount(ImageLightbox, { props: defaultProps, global: { stubs: { teleport: true } } })
    expect(wrapper.find('.lightbox-overlay').exists()).toBe(true)
  })

  it('does not render when isOpen is false', () => {
    const wrapper = mount(ImageLightbox, { props: { ...defaultProps, isOpen: false }, global: { stubs: { teleport: true } } })
    expect(wrapper.find('.lightbox-overlay').exists()).toBe(false)
  })

  it('emits close on Escape key', async () => {
    const wrapper = mount(ImageLightbox, { props: defaultProps, global: { stubs: { teleport: true } } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits navigate on arrow keys', async () => {
    const wrapper = mount(ImageLightbox, { props: defaultProps, global: { stubs: { teleport: true } } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')![0][0]).toBe('next')
  })

  it('emits navigate prev on left arrow', async () => {
    const wrapper = mount(ImageLightbox, { props: defaultProps, global: { stubs: { teleport: true } } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(wrapper.emitted('navigate')![0][0]).toBe('prev')
  })

  it('shows current index / total', () => {
    const wrapper = mount(ImageLightbox, { props: defaultProps, global: { stubs: { teleport: true } } })
    expect(wrapper.text()).toContain('1 / 3')
  })
})
