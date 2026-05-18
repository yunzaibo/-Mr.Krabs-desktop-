/**
 * Skills API Error Paths — 补全错误路径与边缘场景
 *
 * 覆盖：
 *  - getSkills (via apiGet) 网络错误传播
 *  - installSkill / uninstallSkill invoke 错误返回值
 *  - setSkillEnabled 的 backend→local-fallback 降级
 *  - searchClawHub invoke 错误传播
 *  - installFromHub 错误传播
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
} from '../skills'

describe('Skills API Error Paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockReset()
    mockApiGet.mockReset()
  })

  // ─── getSkills ──────────────────────────────────

  describe('getSkills', () => {
    it('propagates network error', async () => {
      mockApiGet.mockRejectedValue(new Error('fetch failed'))
      await expect(getSkills()).rejects.toThrow('fetch failed')
    })

    it('propagates 500 error', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('db down'), { status: 500 }))
      await expect(getSkills()).rejects.toThrow('db down')
    })
  })

  // ─── installSkill ───────────────────────────────

  describe('installSkill', () => {
    it('returns error result for invalid source', async () => {
      mockInvoke.mockRejectedValue(new Error('invalid source'))
      const r = await installSkill('', 'file')
      expect(r.success).toBe(false)
      expect(r.message).toBe('invalid source')
    })

    it('sends skillType parameter when provided', async () => {
      mockInvoke.mockResolvedValue({ success: true, name: 'my-skill', message: 'installed' })
      await installSkill('/path/to/skill.zip', 'file')
      expect(mockInvoke).toHaveBeenCalledWith('skill_install', {
        source: '/path/to/skill.zip',
        skillType: 'file',
      })
    })

    it('returns error result when skill already installed', async () => {
      mockInvoke.mockRejectedValue(new Error('skill already exists'))
      const r = await installSkill('clawhub://dup', 'clawhub')
      expect(r.success).toBe(false)
      expect(r.message).toBe('skill already exists')
    })
  })

  // ─── uninstallSkill ─────────────────────────────

  describe('uninstallSkill', () => {
    it('passes skill name directly to invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: 'uninstalled' })
      await uninstallSkill('my skill/中文')
      expect(mockInvoke).toHaveBeenCalledWith('skill_uninstall', {
        name: 'my skill/中文',
      })
    })

    it('returns error result when skill does not exist', async () => {
      mockInvoke.mockRejectedValue(new Error('skill not found'))
      const r = await uninstallSkill('ghost')
      expect(r.success).toBe(false)
      expect(r.message).toBe('skill not found')
    })

    it('idempotent — repeated uninstall calls invoke each time', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: 'uninstalled' })
      await uninstallSkill('a')
      await uninstallSkill('a')
      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })
  })

  // ─── setSkillEnabled — backend/local fallback ──

  describe('setSkillEnabled', () => {
    it('returns backend source on success', async () => {
      mockInvoke.mockResolvedValue({ success: true, enabled: true, requires_restart: false })
      const r = await setSkillEnabled('skill-a', true)
      expect(r.source).toBe('backend')
      expect(r.success).toBe(true)
      expect(r.enabled).toBe(true)
    })

    it('falls back to local when backend rejects (network down)', async () => {
      mockInvoke.mockRejectedValue(new Error('ECONNREFUSED'))
      const r = await setSkillEnabled('skill-b', false)
      expect(r.source).toBe('local-fallback')
      expect(r.success).toBe(true)
      expect(r.enabled).toBe(false)
      expect(r.warning).toMatch(/Backend unreachable/i)
    })

    it('falls back to local on error', async () => {
      mockInvoke.mockRejectedValue(new Error('server error'))
      const r = await setSkillEnabled('skill-c', true)
      expect(r.source).toBe('local-fallback')
      expect(r.message).toBe('server error')
    })

    it('trusts requested enabled when backend returns non-boolean', async () => {
      mockInvoke.mockResolvedValue({ success: true, enabled: 'yes' as unknown as boolean })
      const r = await setSkillEnabled('skill-d', false)
      expect(r.enabled).toBe(false)
      expect(r.source).toBe('backend')
    })

    it('passes name and enabled to invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, enabled: true })
      await setSkillEnabled('a b/c', true)
      expect(mockInvoke).toHaveBeenCalledWith('skill_set_enabled', {
        name: 'a b/c',
        enabled: true,
      })
    })
  })

  // ─── searchClawHub ──────────────────────────────

  describe('searchClawHub', () => {
    it('propagates invoke rejection', async () => {
      mockInvoke.mockRejectedValue(new Error('upstream hub offline'))
      await expect(searchClawHub()).rejects.toThrow('upstream hub offline')
    })

    it('returns empty array when invoke returns empty array', async () => {
      mockInvoke.mockResolvedValue([])
      const r = await searchClawHub()
      expect(r).toEqual([])
    })

    it('returns skills array from invoke', async () => {
      mockInvoke.mockResolvedValue([
        { name: 'a', description: 'x', author: 'y', version: '1', tags: [], downloads: 0, category: 'coding' },
      ])
      const r = await searchClawHub()
      expect(r).toHaveLength(1)
      expect(r[0]!.name).toBe('a')
    })

    it('propagates network error', async () => {
      mockInvoke.mockRejectedValue(new Error('offline'))
      await expect(searchClawHub('q')).rejects.toThrow('offline')
    })
  })

  // ─── installFromHub ─────────────────────────────

  describe('installFromHub', () => {
    it('calls invoke with clawhub:// prefix via installSkill', async () => {
      mockInvoke.mockResolvedValue({ success: true, name: 'x', message: 'ok' })
      await installFromHub('my-skill')
      expect(mockInvoke).toHaveBeenCalledWith('skill_install', {
        source: 'clawhub://my-skill',
        skillType: 'clawhub',
      })
    })

    it('throws when installSkill returns failure', async () => {
      mockInvoke.mockRejectedValue(new Error('hub skill not found'))
      await expect(installFromHub('ghost')).rejects.toThrow('hub skill not found')
    })
  })
})
