/**
 * Chain F: Skills -> Hub -> Install
 *
 * Tests the skills lifecycle: list installed skills, search ClawHub,
 * install from hub, install from local, uninstall, enable/disable.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ── Hoisted mocks ──────────────────────────────────────────────────

const { mockApiGet, mockInvoke } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockInvoke: vi.fn(),
}))

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/api/client', () => ({
  apiGet: mockApiGet,
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  api: {},
  apiSSE: vi.fn(),
  apiWebSocket: vi.fn(),
  fromNativeError: vi.fn(),
  createApiError: vi.fn(),
  isRetryable: vi.fn(),
  getErrorMessage: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}))

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────

describe('Chain F: Skills -> Hub -> Install', () => {
  it('F1: getSkills returns skill list via GET /api/v1/skills', async () => {
    mockApiGet.mockResolvedValueOnce({
      skills: [
        { name: 'code-review', description: 'Code review', author: 'dev', version: '1.0.0', triggers: [], tags: ['coding'] },
        { name: 'web-search', description: 'Web search', author: 'dev', version: '2.0.0', triggers: [], tags: ['search'] },
      ],
      total: 2,
      dir: '/home/user/.hexclaw/skills',
    })

    const { getSkills } = await import('@/api/skills')
    const result = await getSkills()

    expect(mockApiGet).toHaveBeenCalledWith('/api/v1/skills')
    expect(result.skills).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.dir).toBe('/home/user/.hexclaw/skills')
    expect(result.skills[0]!.name).toBe('code-review')
  })

  it('F2: searchClawHub searches the hub via invoke skill_search', async () => {
    mockInvoke.mockResolvedValueOnce([
      { name: 'git-commit-craft', description: 'Git commit message generator', author: 'devtools', version: '1.4.2', tags: ['git'], downloads: 19200, category: 'coding' },
    ])

    const { searchClawHub } = await import('@/api/skills')
    const results = await searchClawHub('git', 'coding')

    expect(mockInvoke).toHaveBeenCalledWith(
      'skill_search',
      { query: 'git', category: 'coding' },
    )

    expect(results).toHaveLength(1)
    expect(results[0]!.name).toBe('git-commit-craft')
    expect(results[0]!.category).toBe('coding')
  })

  it('F2b: searchClawHub without query or category calls invoke with undefined values', async () => {
    mockInvoke.mockResolvedValueOnce([])

    const { searchClawHub } = await import('@/api/skills')
    await searchClawHub()

    expect(mockInvoke).toHaveBeenCalledWith('skill_search', { query: undefined, category: undefined })
  })

  it('F2c: searchClawHub passes category=all to invoke (does not filter locally)', async () => {
    mockInvoke.mockResolvedValueOnce([])

    const { searchClawHub } = await import('@/api/skills')
    await searchClawHub('', 'all')

    expect(mockInvoke).toHaveBeenCalledWith('skill_search', { query: '', category: 'all' })
  })

  it('F2d: searchClawHub propagates backend error', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Hub unreachable'))

    const { searchClawHub } = await import('@/api/skills')
    await expect(searchClawHub('test')).rejects.toThrow('Hub unreachable')
  })

  it('F3: installFromHub sends install request with clawhub:// source', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, name: 'code-review-pro', description: 'Auto review', version: '2.1.0', message: 'installed' })

    const { installFromHub } = await import('@/api/skills')
    await installFromHub('code-review-pro')

    expect(mockInvoke).toHaveBeenCalledWith('skill_install', {
      source: 'clawhub://code-review-pro',
      skillType: 'clawhub',
    })
  })

  it('F4: installSkill installs from local path', async () => {
    mockInvoke.mockResolvedValueOnce({
      success: true,
      name: 'my-skill',
      description: 'Local skill',
      version: '0.1.0',
      message: 'installed',
    })

    const { installSkill } = await import('@/api/skills')
    const result = await installSkill('/path/to/skill')

    expect(mockInvoke).toHaveBeenCalledWith('skill_install', {
      source: '/path/to/skill',
      skillType: undefined,
    })
    expect(result.success).toBe(true)
    expect(result.message).toBe('installed')
  })

  it('F5: uninstallSkill calls invoke skill_uninstall', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true })

    const { uninstallSkill } = await import('@/api/skills')
    const result = await uninstallSkill('obsolete-skill')

    expect(mockInvoke).toHaveBeenCalledWith('skill_uninstall', { name: 'obsolete-skill' })
    expect(result.success).toBe(true)
  })

  it('F6: setSkillEnabled calls invoke skill_set_enabled', async () => {
    mockInvoke.mockResolvedValueOnce({
      success: true,
      enabled: false,
      effective_enabled: false,
      requires_restart: false,
      message: 'Skill disabled',
    })

    const { setSkillEnabled } = await import('@/api/skills')
    const result = await setSkillEnabled('code-review', false)

    expect(mockInvoke).toHaveBeenCalledWith('skill_set_enabled', { name: 'code-review', enabled: false })
    expect(result.success).toBe(true)
    expect(result.enabled).toBe(false)
    expect(result.source).toBe('backend')
  })

  it('F6b: setSkillEnabled falls back to local on backend failure', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Backend unavailable'))

    const { setSkillEnabled } = await import('@/api/skills')
    const result = await setSkillEnabled('offline-skill', true)

    expect(result.success).toBe(true)
    expect(result.enabled).toBe(true)
    expect(result.source).toBe('local-fallback')
    expect(result.warning).toBeDefined()
    expect(result.message).toBe('Backend unavailable')
  })

  it('F7: CLAWHUB_CATEGORIES contains all expected categories', async () => {
    const { CLAWHUB_CATEGORIES } = await import('@/api/skills')

    expect(CLAWHUB_CATEGORIES).toEqual(['all', 'coding', 'research', 'writing', 'data', 'automation', 'productivity'])
  })

  it('F8: full lifecycle: search hub -> install -> list -> disable -> uninstall', async () => {
    const { searchClawHub, installFromHub, getSkills, setSkillEnabled, uninstallSkill } = await import('@/api/skills')

    // Search (uses invoke)
    mockInvoke.mockResolvedValueOnce([
      { name: 'fact-checker', description: 'Fact check', author: 'verify-ai', version: '1.0.5', tags: [], downloads: 8930, category: 'research' },
    ])
    const searchResults = await searchClawHub('fact')
    expect(searchResults).toHaveLength(1)

    // Install (uses invoke)
    mockInvoke.mockResolvedValueOnce({ success: true, name: 'fact-checker', message: 'installed' })
    await installFromHub('fact-checker')

    // List (uses apiGet)
    mockApiGet.mockResolvedValueOnce({
      skills: [{ name: 'fact-checker', description: 'Fact check', author: 'verify-ai', version: '1.0.5', triggers: [], tags: [] }],
      total: 1,
      dir: '/skills',
    })
    const skills = await getSkills()
    expect(skills.skills.find((s) => s.name === 'fact-checker')).toBeDefined()

    // Disable (uses invoke)
    mockInvoke.mockResolvedValueOnce({ success: true, enabled: false })
    const disableResult = await setSkillEnabled('fact-checker', false)
    expect(disableResult.enabled).toBe(false)

    // Uninstall (uses invoke)
    mockInvoke.mockResolvedValueOnce({ success: true })
    await uninstallSkill('fact-checker')
    expect(mockInvoke).toHaveBeenCalledWith('skill_uninstall', { name: 'fact-checker' })
  })
})
