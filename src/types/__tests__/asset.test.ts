import { describe, it, expect } from 'vitest'
import type { AssetRenderDTO, AssetMeta, EditLock, SnapshotVersion, VersionHistory, EditableDocument, LightboxState } from '../asset'
import { formatFileSize, classifyAssetType } from '../asset'

describe('Asset Types', () => {
  it('AssetRenderDTO has required fields', () => {
    const dto: AssetRenderDTO = {
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
    expect(dto.assetType).toBe('image')
  })

  it('AssetMeta supports all asset types', () => {
    const image: AssetMeta = { assetType: 'image', fileName: 'a.png' }
    const file: AssetMeta = { assetType: 'file', fileName: 'b.pdf' }
    const md: AssetMeta = { assetType: 'markdown', fileName: 'c.md' }
    expect(image.assetType).toBe('image')
    expect(file.assetType).toBe('file')
    expect(md.assetType).toBe('markdown')
  })

  it('EditLock has correct structure', () => {
    const lock: EditLock = {
      locked: true,
      lockedAt: '2026-05-19T12:00:00Z',
      lockedBy: 'desktop-1234',
    }
    expect(lock.locked).toBe(true)
  })

  it('SnapshotVersion has correct structure', () => {
    const snap: SnapshotVersion = {
      versionNumber: 1,
      createdAt: '2026-05-19T12:00:00Z',
      contentHash: 'abc123',
      description: 'Initial save',
      sizeBytes: 1024,
    }
    expect(snap.versionNumber).toBe(1)
  })

  it('VersionHistory has correct structure', () => {
    const vh: VersionHistory = {
      assetId: 'test-1',
      versions: [],
      maxVersions: 20,
    }
    expect(vh.maxVersions).toBe(20)
  })

  it('EditableDocument has correct structure', () => {
    const doc: EditableDocument = {
      assetId: 'test-1',
      content: '# Hello',
      originalHash: 'abc123',
      isDirty: false,
      openedAt: '2026-05-19T12:00:00Z',
    }
    expect(doc.isDirty).toBe(false)
  })

  it('LightboxState has correct structure', () => {
    const state: LightboxState = {
      isOpen: true,
      currentAssetId: 'a-1',
      galleryIds: ['a-1', 'a-2'],
      currentIndex: 0,
    }
    expect(state.isOpen).toBe(true)
  })
})

describe('Asset Utility Functions', () => {
  describe('formatFileSize', () => {
    it('formats 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('formats bytes', () => {
      expect(formatFileSize(512)).toBe('512 B')
    })

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
    })

    it('formats megabytes', () => {
      expect(formatFileSize(1258291)).toBe('1.2 MB')
    })

    it('formats gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
    })
  })

  describe('classifyAssetType', () => {
    it('classifies image types', () => {
      expect(classifyAssetType('image/png')).toBe('image')
      expect(classifyAssetType('image/jpeg')).toBe('image')
      expect(classifyAssetType('image/gif')).toBe('image')
    })

    it('classifies markdown types', () => {
      expect(classifyAssetType('text/markdown')).toBe('markdown')
      expect(classifyAssetType('text/x-markdown')).toBe('markdown')
    })

    it('defaults to file for unknown types', () => {
      expect(classifyAssetType('application/pdf')).toBe('file')
      expect(classifyAssetType('text/plain')).toBe('file')
      expect(classifyAssetType('application/zip')).toBe('file')
    })
  })
})
