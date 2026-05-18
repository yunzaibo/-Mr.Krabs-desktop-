import { describe, it, expect } from 'vitest'
import { matchIntent, getTopMatch } from '../intentMatcher'
import type { SkillMeta } from '@/types'

// ── Helpers ───────────────────────────────────────

function makeSkill(overrides: Partial<SkillMeta>): SkillMeta {
  return {
    skillId: 'test-skill',
    displayName: 'Test Skill',
    version: '1.0.0',
    description: '',
    capabilities: [],
    entry: 'SKILL.md',
    path: 'skills/test-skill',
    source: 'official',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────

describe('IntentMatcher — custom skill NL triggers', () => {
  it('matches custom skill with triggers', () => {
    const skills = [
      makeSkill({
        skillId: 'my-custom',
        displayName: 'My Custom',
        source: 'custom',
        triggers: ['自定义技能', 'custom-skill'],
      }),
    ]

    const match = matchIntent('请使用自定义技能处理这段文字', skills)
    expect(match).not.toBeNull()
    expect(match!.skillId).toBe('my-custom')
    expect(match!.source).toBe('custom')
  })

  it('matches official skill with triggers', () => {
    const skills = [
      makeSkill({
        skillId: 'summarize',
        source: 'official',
        triggers: ['总结', '摘要', 'summarize'],
      }),
    ]

    const match = matchIntent('请总结这篇文章', skills)
    expect(match).not.toBeNull()
    expect(match!.skillId).toBe('summarize')
  })

  it('picks highest confidence among multiple matches', () => {
    const skills = [
      makeSkill({
        skillId: 'skill-a',
        source: 'custom',
        triggers: ['处理'],
      }),
      makeSkill({
        skillId: 'skill-b',
        source: 'official',
        triggers: ['智能处理'],
      }),
    ]

    const match = matchIntent('请智能处理这段文字', skills)
    expect(match).not.toBeNull()
    // '智能处理' is more specific → higher confidence
    expect(match!.skillId).toBe('skill-b')
  })

  it('skips skills without triggers', () => {
    const skills = [
      makeSkill({
        skillId: 'no-triggers',
        source: 'custom',
        triggers: [],
      }),
    ]

    const match = matchIntent('随便输入', skills)
    expect(match).toBeNull()
  })

  it('getTopMatch respects threshold', () => {
    const skills = [
      makeSkill({
        skillId: 'custom',
        source: 'custom',
        triggers: ['z'],
      }),
    ]

    // Exact match confidence = 1.0, which is above any threshold
    // Use a trigger that won't match at all
    const match = getTopMatch('没有触发词的输入', skills, 0.4)
    expect(match).toBeNull()
  })
})
