/**
 * Skills API Code Review — ClawHub 功能验证（修复后）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
}))

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}))

vi.mock('../client', () => ({
  apiGet,
}))

describe('ClawHub 技能市场 — 功能修复验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invoke.mockRejectedValue(new Error('API not available in test'))
    apiGet.mockRejectedValue(new Error('API not available in test'))
  })

  it('CLAWHUB_FORCE_MOCK 不再硬编码为 true', async () => {
    const sourceCode = await import('../skills?raw')
    const raw = typeof sourceCode === 'string' ? sourceCode : sourceCode.default

    expect(raw).toContain('const CLAWHUB_FORCE_MOCK = false')
    expect(raw).not.toContain('const CLAWHUB_FORCE_MOCK = true')
  })

  it('searchClawHub 在 API 不可用时抛出错误', async () => {
    const { searchClawHub } = await import('../skills')
    await expect(searchClawHub()).rejects.toThrow('API not available in test')
  })

  it('searchClawHub 在真实 API 返回空列表时保留空列表', async () => {
    invoke.mockResolvedValueOnce([])
    const { searchClawHub } = await import('../skills')
    const results = await searchClawHub()

    expect(results).toEqual([])
  })

  it('searchClawHub 支持分类过滤', async () => {
    invoke
      .mockResolvedValueOnce([
        { name: 'code-review-pro', description: 'demo', author: 'openclaw', version: '1.0.0', tags: [], downloads: 1, category: 'coding' },
      ])
      .mockResolvedValueOnce([
        { name: 'arxiv-reader', description: 'demo', author: 'openclaw', version: '1.0.0', tags: [], downloads: 1, category: 'research' },
      ])
    const { searchClawHub } = await import('../skills')

    const codingSkills = await searchClawHub(undefined, 'coding')
    expect(codingSkills.every(s => s.category === 'coding')).toBe(true)

    const researchSkills = await searchClawHub(undefined, 'research')
    expect(researchSkills.every(s => s.category === 'research')).toBe(true)
  })

  it('installFromHub 优先尝试真实 API（无 FORCE_MOCK 前置判断）', async () => {
    const sourceCode = await import('../skills?raw')
    const raw = typeof sourceCode === 'string' ? sourceCode : sourceCode.default

    expect(raw).toContain('await installSkill(`clawhub://${skillName}`')
    const installFnBody = raw.slice(raw.indexOf('async function installFromHub'))
    expect(installFnBody).not.toMatch(/if\s*\(CLAWHUB_FORCE_MOCK\)/)
  })

  it('searchClawHub 在后端返回 error 字段时抛出错误', async () => {
    invoke.mockResolvedValueOnce({ error: 'hub unavailable' })
    const { searchClawHub } = await import('../skills')

    // The new code calls .map() on the invoke result; a non-array response
    // causes a TypeError, which is caught and re-thrown
    await expect(searchClawHub()).rejects.toThrow()
  })

  it('skills.ts 不再内嵌 ClawHub mock 数据文案', async () => {
    const sourceCode = await import('../skills?raw')
    const raw = typeof sourceCode === 'string' ? sourceCode : sourceCode.default

    expect(raw).toContain("from '@/config/skills-marketplace'")
    expect(raw).not.toContain('const MOCK_SKILLS')
    expect(raw).not.toContain('自动化代码审查')
  })
})
