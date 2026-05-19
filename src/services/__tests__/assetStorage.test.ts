import { describe, it, expect, vi } from 'vitest'
import { validateAssetPath, formatFileSize, classifyAssetType } from '../assetStorage'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('assetStorage', () => {
  describe('validateAssetPath', () => {
    it('rejects paths with ..', () => {
      expect(validateAssetPath('assets/../../etc/passwd')).toBe(false)
    })

    it('rejects absolute paths', () => {
      expect(validateAssetPath('/etc/passwd')).toBe(false)
    })

    it('rejects paths with special characters', () => {
      expect(validateAssetPath('assets/file name.png')).toBe(false)
      expect(validateAssetPath('assets/file@name.png')).toBe(false)
    })

    it('accepts valid relative paths', () => {
      expect(validateAssetPath('assets/abc123/original.png')).toBe(true)
    })
  })

  describe('atomicWrite', () => {
    it('writes to temp file then renames', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue(undefined)

      const { atomicWrite } = await import('../assetStorage')
      await atomicWrite('/app/data/test.txt', 'hello')

      expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
        path: '/app/data/test.txt.tmp',
        contents: 'hello',
      })
      expect(mockInvoke).toHaveBeenCalledWith('rename_file', {
        from: '/app/data/test.txt.tmp',
        to: '/app/data/test.txt',
      })
    })

    it('cleans up temp file on rename failure', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = vi.mocked(invoke)
      mockInvoke
        .mockResolvedValueOnce(undefined) // writeTextFile
        .mockRejectedValueOnce(new Error('rename failed')) // renameFile
        .mockResolvedValueOnce(undefined) // cleanup

      const { atomicWrite } = await import('../assetStorage')
      await expect(atomicWrite('/app/data/test.txt', 'hello')).rejects.toThrow()
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1258291)).toBe('1.2 MB')
    })
  })

  describe('classifyAssetType', () => {
    it('classifies image types', () => {
      expect(classifyAssetType('image/png')).toBe('image')
      expect(classifyAssetType('image/jpeg')).toBe('image')
    })

    it('classifies markdown types', () => {
      expect(classifyAssetType('text/markdown')).toBe('markdown')
      expect(classifyAssetType('text/x-markdown')).toBe('markdown')
    })

    it('defaults to file for unknown types', () => {
      expect(classifyAssetType('application/pdf')).toBe('file')
      expect(classifyAssetType('text/plain')).toBe('file')
    })
  })
})
