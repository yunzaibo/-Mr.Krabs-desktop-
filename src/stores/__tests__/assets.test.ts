import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAssetStore } from '../assets'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

describe('useAssetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty registry', () => {
    const store = useAssetStore()
    expect(store.assetCount).toBe(0)
    expect(store.registry.size).toBe(0)
  })

  it('registers an asset', () => {
    const store = useAssetStore()
    store.registerAsset({
      assetId: 'test-1',
      assetType: 'image',
      fileName: 'photo.png',
      fileSizeFormatted: '1.2 MB',
      sizeBytes: 1258291,
      mimeType: 'image/png',
      editable: false,
      hasVersions: false,
      contentHash: 'abc123',
    })
    expect(store.assetCount).toBe(1)
    expect(store.getAsset('test-1')?.fileName).toBe('photo.png')
  })

  it('unregisters an asset', () => {
    const store = useAssetStore()
    store.registerAsset({
      assetId: 'test-1',
      assetType: 'image',
      fileName: 'photo.png',
      fileSizeFormatted: '1.2 MB',
      sizeBytes: 1258291,
      mimeType: 'image/png',
      editable: false,
      hasVersions: false,
      contentHash: 'abc123',
    })
    store.unregisterAsset('test-1')
    expect(store.assetCount).toBe(0)
  })

  it('manages lightbox state', () => {
    const store = useAssetStore()
    store.openLightbox('asset-1', ['asset-1', 'asset-2', 'asset-3'])
    expect(store.lightbox.isOpen).toBe(true)
    expect(store.lightbox.currentAssetId).toBe('asset-1')
    expect(store.lightbox.currentIndex).toBe(0)

    store.closeLightbox()
    expect(store.lightbox.isOpen).toBe(false)
  })

  it('computes total storage bytes', () => {
    const store = useAssetStore()
    store.registerAsset({
      assetId: 'a',
      assetType: 'image',
      fileName: 'a.png',
      fileSizeFormatted: '1 KB',
      sizeBytes: 1024,
      mimeType: 'image/png',
      editable: false,
      hasVersions: false,
      contentHash: 'a',
    })
    store.registerAsset({
      assetId: 'b',
      assetType: 'file',
      fileName: 'b.pdf',
      fileSizeFormatted: '2 KB',
      sizeBytes: 2048,
      mimeType: 'application/pdf',
      editable: false,
      hasVersions: false,
      contentHash: 'b',
    })
    expect(store.totalStorageBytes).toBe(3072)
  })
})
