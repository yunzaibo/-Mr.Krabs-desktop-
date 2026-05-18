import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Tauri FS ────────────────────────────────

const mocks = vi.hoisted(() => ({
  mockReadTextFile: vi.fn(),
  mockReadDir: vi.fn(),
  mockWriteTextFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockExists: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: mocks.mockReadTextFile,
  readDir: mocks.mockReadDir,
  writeTextFile: mocks.mockWriteTextFile,
  mkdir: mocks.mockMkdir,
  exists: mocks.mockExists,
}))

vi.mock('@tauri-apps/api/path', () => ({
  BaseDirectory: { Resource: 1, AppData: 2 },
}))

vi.mock('../claudeCodeImporter', () => ({
  detectClaudeCodeFormat: vi.fn().mockResolvedValue({ isClaudeCode: false }),
  importClaudeCodeSkill: vi.fn(),
}))

import { installSkillFromDirectory } from '../skillDirectoryInstaller'
import { detectClaudeCodeFormat, importClaudeCodeSkill } from '../claudeCodeImporter'

// ── Tests ─────────────────────────────────────────

describe('skillDirectoryInstaller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockMkdir.mockResolvedValue(undefined)
    mocks.mockWriteTextFile.mockResolvedValue(undefined)
    mocks.mockReadDir.mockResolvedValue([])
  })

  // ── Scenario A: Native skill directory ──

  describe('native skill directory', () => {
    it('copies skill.json + SKILL.md to AppData', async () => {
      mocks.mockExists.mockImplementation(async (p: string) => {
        if (p.endsWith('skill.json')) return true
        if (p.endsWith('SKILL.md')) return true
        return false
      })

      mocks.mockReadTextFile
        .mockResolvedValueOnce('{"name":"test","version":"1.0.0"}')
        .mockResolvedValueOnce('# Test Skill')

      const result = await installSkillFromDirectory('/tmp/my-test-skill')

      expect(result.success).toBe(true)
      expect(result.skillId).toBe('my-test-skill')
      expect(mocks.mockMkdir).toHaveBeenCalledWith(
        'skills/my-test-skill',
        { recursive: true, baseDir: 2 },
      )
      // skill.json + SKILL.md = 2 writes
      expect(mocks.mockWriteTextFile).toHaveBeenCalledTimes(2)
    })

    it('generates minimal skill.json when missing', async () => {
      mocks.mockExists.mockImplementation(async (p: string) => {
        if (p.endsWith('SKILL.md')) return true
        return false
      })

      mocks.mockReadTextFile
        .mockResolvedValueOnce('# Test Skill')

      const result = await installSkillFromDirectory('/tmp/my-skill')

      expect(result.success).toBe(true)
      expect(result.skillId).toBe('my-skill')

      // skill.json should be generated
      const skillJsonCall = mocks.mockWriteTextFile.mock.calls.find(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('skill.json'),
      )
      expect(skillJsonCall).toBeDefined()
      const generated = JSON.parse(skillJsonCall![1] as string)
      expect(generated.name).toBe('my-skill')
      expect(generated.entry).toBe('SKILL.md')
    })

    it('copies references/ directory if present', async () => {
      mocks.mockExists.mockImplementation(async (p: string) => {
        if (p.endsWith('skill.json')) return true
        if (p.endsWith('SKILL.md')) return true
        if (p.endsWith('references')) return true
        return false
      })

      mocks.mockReadTextFile
        .mockResolvedValueOnce('{"name":"test"}')
        .mockResolvedValueOnce('# Test')
        .mockResolvedValueOnce('ref content')

      mocks.mockReadDir
        .mockResolvedValueOnce([{ name: 'ref.md', isFile: true, isDirectory: false }])

      const result = await installSkillFromDirectory('/tmp/my-skill')

      expect(result.success).toBe(true)
      // mkdir called twice: main dir + references dir
      expect(mocks.mockMkdir).toHaveBeenCalledTimes(2)
      expect(mocks.mockMkdir).toHaveBeenCalledWith(
        'skills/my-skill/references',
        { recursive: true, baseDir: 2 },
      )
    })
  })

  // ── Scenario B: Claude Code directory ──

  describe('Claude Code directory', () => {
    it('delegates to importClaudeCodeSkill', async () => {
      mocks.mockExists.mockImplementation(async () => false)

      vi.mocked(detectClaudeCodeFormat).mockResolvedValueOnce({
        isClaudeCode: true,
        hasCommands: true,
        hasAgents: false,
        hasHooks: false,
      })

      vi.mocked(importClaudeCodeSkill).mockResolvedValueOnce({
        success: true,
        skillId: 'claude-skill',
        warnings: [],
      })

      const result = await installSkillFromDirectory('/tmp/claude-project')

      expect(result.success).toBe(true)
      expect(result.skillId).toBe('claude-skill')
      expect(importClaudeCodeSkill).toHaveBeenCalled()
    })
  })

  // ── Scenario C: Invalid directory ──

  describe('invalid directory', () => {
    it('returns error for unrecognized directory', async () => {
      mocks.mockExists.mockImplementation(async () => false)

      vi.mocked(detectClaudeCodeFormat).mockResolvedValueOnce({
        isClaudeCode: false,
        hasCommands: false,
        hasAgents: false,
        hasHooks: false,
      })

      const result = await installSkillFromDirectory('/tmp/random-dir')

      expect(result.success).toBe(false)
      expect(result.warnings[0]).toContain('不是有效的技能格式')
    })
  })
})
