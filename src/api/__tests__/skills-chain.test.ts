/**
 * Skills Chain — 全场景覆盖
 *
 * 覆盖 getSkills / installSkill / uninstallSkill / setSkillEnabled
 *        searchClawHub / installFromHub / CLAWHUB_CATEGORIES
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInvoke = vi.hoisted(() => vi.fn())
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}))

const mockApiGet = vi.hoisted(() => vi.fn())
vi.mock('../client', () => ({
  apiGet: mockApiGet,
}))

import {
  getSkills,
  installSkill,
  uninstallSkill,
  setSkillEnabled,
  searchClawHub,
  installFromHub,
  CLAWHUB_CATEGORIES,
} from '../skills'

describe('Skills Chain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockReset()
    mockApiGet.mockReset()
  })

  // ─── getSkills ───────────────────────────────────

  describe('getSkills', () => {
    it('calls apiGet with /api/v1/skills', async () => {
      mockApiGet.mockResolvedValue({ skills: [], total: 0, dir: '/skills' })
      const result = await getSkills()
      expect(mockApiGet).toHaveBeenCalledWith('/api/v1/skills')
      expect(result.skills).toEqual([])
      expect(result.dir).toBe('/skills')
    })
  })

  // ─── installSkill ────────────────────────────────

  describe('installSkill', () => {
    it('calls invoke with skill_install command and source', async () => {
      mockInvoke.mockResolvedValue({ success: true, name: 'test', message: 'ok' })
      await installSkill('/path/to/skill')
      expect(mockInvoke).toHaveBeenCalledWith('skill_install', {
        source: '/path/to/skill',
        skillType: undefined,
      })
    })
  })

  // ─── uninstallSkill ──────────────────────────────

  describe('uninstallSkill', () => {
    it('calls invoke with skill_uninstall command and name', async () => {
      mockInvoke.mockResolvedValue({ success: true })
      await uninstallSkill('my skill/v2')
      expect(mockInvoke).toHaveBeenCalledWith('skill_uninstall', {
        name: 'my skill/v2',
      })
    })
  })

  // ─── setSkillEnabled ─────────────────────────────

  describe('setSkillEnabled', () => {
    it('returns backend source on success', async () => {
      mockInvoke.mockResolvedValue({ success: true, enabled: true, effective_enabled: true, requires_restart: false, message: 'ok' })
      const result = await setSkillEnabled('test-skill', true)
      expect(result.source).toBe('backend')
      expect(result.success).toBe(true)
      expect(result.enabled).toBe(true)
    })

    it('falls back to local when backend unreachable', async () => {
      mockInvoke.mockRejectedValue(new Error('Connection refused'))
      const result = await setSkillEnabled('test-skill', false)
      expect(result.source).toBe('local-fallback')
      expect(result.success).toBe(true)
      expect(result.enabled).toBe(false)
      expect(result.warning).toContain('Backend unreachable')
    })

    it('handles partial backend response (missing effective_enabled)', async () => {
      mockInvoke.mockResolvedValue({ success: true, enabled: true })
      const result = await setSkillEnabled('test-skill', true)
      expect(result.effective_enabled).toBeUndefined()
      expect(result.requires_restart).toBeUndefined()
    })

    it('uses requested enabled value when backend omits it', async () => {
      mockInvoke.mockResolvedValue({ success: true })
      const result = await setSkillEnabled('test-skill', true)
      expect(result.enabled).toBe(true)
    })
  })

  // ─── searchClawHub ───────────────────────────────

  describe('searchClawHub', () => {
    it('calls invoke with skill_search command and args', async () => {
      mockInvoke.mockResolvedValue([])
      await searchClawHub('code-review', 'coding')
      expect(mockInvoke).toHaveBeenCalledWith('skill_search', {
        query: 'code-review',
        category: 'coding',
      })
    })

    it('passes undefined for omitted params', async () => {
      mockInvoke.mockResolvedValue([])
      await searchClawHub()
      expect(mockInvoke).toHaveBeenCalledWith('skill_search', {
        query: undefined,
        category: undefined,
      })
    })

    it('throws when invoke rejects', async () => {
      mockInvoke.mockRejectedValue(new Error('Hub unavailable'))
      await expect(searchClawHub('test')).rejects.toThrow('Hub unavailable')
    })

    it('handles array response from invoke', async () => {
      const skills = [
        { name: 'skill1', description: 'desc', author: 'me', version: '1.0', tags: [], downloads: 0, category: 'coding' },
      ]
      mockInvoke.mockResolvedValue(skills)
      const result = await searchClawHub()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('skill1')
    })

    it('propagates network error', async () => {
      mockInvoke.mockRejectedValue(new Error('offline'))
      await expect(searchClawHub('q')).rejects.toThrow('offline')
    })
  })

  // ─── installFromHub ──────────────────────────────

  describe('installFromHub', () => {
    it('calls invoke with clawhub:// source via installSkill', async () => {
      mockInvoke.mockResolvedValue({ success: true, name: 'code-review-pro', message: 'installed' })
      await installFromHub('code-review-pro')
      expect(mockInvoke).toHaveBeenCalledWith('skill_install', {
        source: 'clawhub://code-review-pro',
        skillType: 'clawhub',
      })
    })
  })

  // ─── Constants ───────────────────────────────────

  describe('CLAWHUB_CATEGORIES', () => {
    it('includes all expected categories', () => {
      expect(CLAWHUB_CATEGORIES).toContain('all')
      expect(CLAWHUB_CATEGORIES).toContain('coding')
      expect(CLAWHUB_CATEGORIES).toContain('research')
      expect(CLAWHUB_CATEGORIES).toContain('writing')
      expect(CLAWHUB_CATEGORIES).toContain('data')
      expect(CLAWHUB_CATEGORIES).toContain('automation')
      expect(CLAWHUB_CATEGORIES).toContain('productivity')
    })
  })
})
