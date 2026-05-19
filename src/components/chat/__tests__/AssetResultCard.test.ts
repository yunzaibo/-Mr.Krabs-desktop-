import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetResultCard from '../AssetResultCard.vue'
import type { AssetRenderDTO } from '@/types/asset'

const mockAsset: AssetRenderDTO = {
  assetId: 'test-1',
  assetType: 'image',
  fileName: 'photo.png',
  fileSizeFormatted: '1.2 MB',
  sizeBytes: 1258291,
  mimeType: 'image/png',
  editable: false,
  hasVersions: false,
  contentHash: 'abc123',
}

const markdownAsset: AssetRenderDTO = {
  ...mockAsset,
  assetId: 'test-2',
  assetType: 'markdown',
  fileName: 'readme.md',
  editable: true,
}

const fileAsset: AssetRenderDTO = {
  ...mockAsset,
  assetId: 'test-3',
  assetType: 'file',
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
}

describe('AssetResultCard', () => {
  it('renders image asset with View button', () => {
    const wrapper = mount(AssetResultCard, { props: { asset: mockAsset } })
    expect(wrapper.find('.result-surface-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('photo.png')
    expect(wrapper.text()).toContain('1.2 MB')
    expect(wrapper.find('[data-testid="primary-action"]').text()).toContain('View')
  })

  it('renders markdown asset with Edit button', () => {
    const wrapper = mount(AssetResultCard, { props: { asset: markdownAsset } })
    expect(wrapper.find('[data-testid="primary-action"]').text()).toContain('Edit')
  })

  it('renders file asset with Download button', () => {
    const wrapper = mount(AssetResultCard, { props: { asset: fileAsset } })
    expect(wrapper.find('[data-testid="primary-action"]').text()).toContain('Download')
  })

  it('emits open-lightbox on image click', async () => {
    const wrapper = mount(AssetResultCard, {
      props: { asset: mockAsset, galleryIds: ['test-1', 'test-2'] },
    })
    await wrapper.find('[data-testid="primary-action"]').trigger('click')
    expect(wrapper.emitted('open-lightbox')).toBeTruthy()
    expect(wrapper.emitted('open-lightbox')![0][0]).toEqual({
      assetId: 'test-1',
      galleryIds: ['test-1', 'test-2'],
    })
  })

  it('emits open-editor on markdown edit', async () => {
    const wrapper = mount(AssetResultCard, { props: { asset: markdownAsset } })
    await wrapper.find('[data-testid="primary-action"]').trigger('click')
    expect(wrapper.emitted('open-editor')).toBeTruthy()
    expect(wrapper.emitted('open-editor')![0][0]).toEqual({ assetId: 'test-2' })
  })

  it('emits download on file download', async () => {
    const wrapper = mount(AssetResultCard, { props: { asset: fileAsset } })
    await wrapper.find('[data-testid="primary-action"]').trigger('click')
    expect(wrapper.emitted('download')).toBeTruthy()
  })

  it('has role="article" for accessibility', () => {
    const wrapper = mount(AssetResultCard, { props: { asset: mockAsset } })
    expect(wrapper.find('[role="article"]').exists()).toBe(true)
  })

  it('handles unknown asset type gracefully', () => {
    const wrapper = mount(AssetResultCard, {
      props: { asset: { ...mockAsset, assetType: 'file', fileName: 'unknown' } },
    })
    expect(wrapper.find('.result-surface-card').exists()).toBe(true)
  })
})
