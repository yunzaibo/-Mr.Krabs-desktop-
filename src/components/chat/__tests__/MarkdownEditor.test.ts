import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkdownEditor from '../MarkdownEditor.vue'

describe('MarkdownEditor', () => {
  const defaultProps = {
    assetId: 'md-1',
    initialContent: '# Hello World\n\nThis is a test.',
    fileName: 'readme.md',
  }

  it('renders with split pane layout', () => {
    const wrapper = mount(MarkdownEditor, { props: defaultProps })
    expect(wrapper.find('.markdown-editor').exists()).toBe(true)
    expect(wrapper.find('.markdown-editor__editor-pane').exists()).toBe(true)
    expect(wrapper.find('.markdown-editor__preview-pane').exists()).toBe(true)
  })

  it('shows file name in header', () => {
    const wrapper = mount(MarkdownEditor, { props: defaultProps })
    expect(wrapper.text()).toContain('readme.md')
  })

  it('has mode toggle buttons', () => {
    const wrapper = mount(MarkdownEditor, { props: defaultProps })
    expect(wrapper.find('[data-testid="mode-split"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mode-edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mode-preview"]').exists()).toBe(true)
  })

  it('emits save on Ctrl+S', async () => {
    const wrapper = mount(MarkdownEditor, { props: defaultProps })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }))
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('emits close on Escape', async () => {
    const wrapper = mount(MarkdownEditor, { props: defaultProps })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
