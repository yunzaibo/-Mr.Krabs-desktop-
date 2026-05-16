import { describe, it, expect } from 'vitest'
import {
  matchIntent,
  calculateConfidence,
  getTopMatch,
} from '@/services/intentMatcher'
import type { SkillMeta } from '@/types'

// ── Helpers ─────────────────────────────────────────────

function makeSkill(overrides: Partial<SkillMeta> & { skillId: string }): SkillMeta {
  return {
    displayName: overrides.skillId,
    version: '1.0.0',
    description: '',
    capabilities: [],
    entry: 'index.ts',
    path: `/skills/${overrides.skillId}`,
    source: 'official',
    triggers: [],
    ...overrides,
  }
}

// ── matchIntent ─────────────────────────────────────────

describe('matchIntent', () => {
  it('精确匹配返回 confidence=1.0', () => {
    const skills = [
      makeSkill({ skillId: 'bulletize', triggers: ['bulletize'] }),
    ]

    const result = matchIntent('bulletize', skills)

    expect(result).not.toBeNull()
    expect(result!.skillId).toBe('bulletize')
    expect(result!.confidence).toBe(1.0)
    expect(result!.matchedTrigger).toBe('bulletize')
  })

  it('包含匹配返回正确置信度', () => {
    const skills = [
      makeSkill({ skillId: 'summarize', triggers: ['summarize'] }),
    ]

    const result = matchIntent('please summarize this article', skills)

    expect(result).not.toBeNull()
    expect(result!.skillId).toBe('summarize')
    expect(result!.confidence).toBeGreaterThan(0.7)
    expect(result!.confidence).toBeLessThan(1.0)
    expect(result!.matchedTrigger).toBe('summarize')
  })

  it('无匹配返回 null', () => {
    const skills = [
      makeSkill({ skillId: 'bulletize', triggers: ['bulletize'] }),
    ]

    const result = matchIntent('hello world', skills)

    expect(result).toBeNull()
  })

  it('只匹配 official skill，跳过 custom', () => {
    const skills = [
      makeSkill({ skillId: 'my-custom', source: 'custom', triggers: ['secret'] }),
      makeSkill({ skillId: 'official-one', source: 'official', triggers: ['official'] }),
    ]

    const result = matchIntent('official', skills)

    expect(result).not.toBeNull()
    expect(result!.skillId).toBe('official-one')
    expect(result!.source).toBe('official')
  })

  it('无 triggers 的 skill 被跳过', () => {
    const skills = [
      makeSkill({ skillId: 'no-triggers', triggers: [] }),
      makeSkill({ skillId: 'has-trigger', triggers: ['search'] }),
    ]

    const result = matchIntent('search the web', skills)

    expect(result).not.toBeNull()
    expect(result!.skillId).toBe('has-trigger')
  })

  it('多个匹配取置信度最高的', () => {
    const skills = [
      makeSkill({ skillId: 'late', triggers: ['end'] }),
      makeSkill({ skillId: 'early', triggers: ['start'] }),
    ]

    const result = matchIntent('start here and end here', skills)

    expect(result).not.toBeNull()
    expect(result!.skillId).toBe('early')
    expect(result!.matchedTrigger).toBe('start')
  })

  it('空输入返回 null', () => {
    expect(matchIntent('', [makeSkill({ skillId: 'x', triggers: ['x'] })])).toBeNull()
  })

  it('空白输入返回 null', () => {
    expect(matchIntent('   ', [makeSkill({ skillId: 'x', triggers: ['x'] })])).toBeNull()
  })
})

// ── calculateConfidence ─────────────────────────────────

describe('calculateConfidence', () => {
  it('精确匹配返回 1.0', () => {
    expect(calculateConfidence('bulletize', 'bulletize')).toBe(1.0)
  })

  it('包含匹配位置权重', () => {
    // trigger 在开头 → idx=0 → proximity = (1-0/20)*0.3 = 0.3 → total = 0.7+0.3 = 1.0
    const input = 'summarize this long article'
    const result = calculateConfidence(input, 'summarize')
    expect(result).toBeGreaterThan(0.7)
    expect(result).toBeLessThanOrEqual(1.0)

    // trigger 在末尾 → idx 较大 → proximity 较小 → total < 1.0
    const result2 = calculateConfidence('please summarize', 'summarize')
    expect(result2).toBeGreaterThan(0.7)
    expect(result2).toBeLessThanOrEqual(1.0)

    // 同一 trigger 在不同位置，靠前的置信度更高
    const early = calculateConfidence('summarize now', 'summarize')
    const late = calculateConfidence('go summarize now', 'summarize')
    expect(early).toBeGreaterThanOrEqual(late)
  })

  it('不匹配返回 0', () => {
    expect(calculateConfidence('hello', 'world')).toBe(0)
    expect(calculateConfidence('abc', 'xyz')).toBe(0)
  })
})

// ── getTopMatch ─────────────────────────────────────────

describe('getTopMatch', () => {
  it('threshold 过滤低置信度', () => {
    const skills = [
      makeSkill({ skillId: 'far-match', triggers: ['end'] }),
    ]

    // contains match 最低置信度 = 0.7 (positionWeight)
    // 设置 threshold > 0.7 来触发过滤
    const result = getTopMatch('start middle end', skills, 0.9)

    expect(result).toBeNull()
  })

  it('默认 threshold=0.4', () => {
    const skills = [
      makeSkill({ skillId: 'bulletize', triggers: ['bulletize'] }),
    ]

    // 精确匹配 confidence=1.0 > 0.4
    const result = getTopMatch('bulletize', skills)

    expect(result).not.toBeNull()
    expect(result!.skillId).toBe('bulletize')
  })

  it('精确匹配通过 threshold', () => {
    const skills = [
      makeSkill({ skillId: 'x', triggers: ['find'] }),
    ]

    // 精确匹配 confidence=1.0，通过默认 threshold 0.4
    const result = getTopMatch('find', skills)

    expect(result).not.toBeNull()
    expect(result!.confidence).toBe(1.0)
  })

  it('no match 返回 null', () => {
    const skills = [
      makeSkill({ skillId: 'x', triggers: ['trigger'] }),
    ]

    expect(getTopMatch('no match here', skills)).toBeNull()
  })
})
