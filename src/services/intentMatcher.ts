/**
 * IntentMatcher — 自然语言触发 Skill 匹配
 *
 * 职责：
 * - 根据用户输入文本匹配 Skill 的 triggers
 * - 计算匹配置信度（精确匹配 vs 包含匹配）
 * - 匹配所有有 triggers 的 Skill（official + custom）
 *
 * 设计原则：
 * - 纯函数，无副作用，无状态
 * - 多个匹配时取置信度最高的
 *
 * @see docs/agents-OS/Module-008-Skill-NL-Trigger.md
 */

import type { SkillMeta } from '@/types'

// ─── Types ────────────────────────────────────────────

export interface IntentMatch {
  skillId: string
  confidence: number
  matchedTrigger: string
  source: 'official' | 'custom'
}

// ─── Core Functions ───────────────────────────────────

/**
 * 遍历所有有 triggers 的 skill，匹配用户输入
 * @returns 置信度最高的匹配结果，无匹配返回 null
 */
export function matchIntent(
  input: string,
  skills: SkillMeta[],
): IntentMatch | null {
  if (!input.trim()) return null

  let best: IntentMatch | null = null

  for (const skill of skills) {
    if (!skill.triggers || skill.triggers.length === 0) continue

    for (const trigger of skill.triggers) {
      if (!input.includes(trigger)) continue

      const confidence = calculateConfidence(input, trigger)
      if (!best || confidence > best.confidence) {
        best = {
          skillId: skill.skillId,
          confidence,
          matchedTrigger: trigger,
          source: skill.source,
        }
      }
    }
  }

  return best
}

/**
 * 计算输入文本与触发词的匹配置信度
 * - 精确匹配 (input === trigger): 1.0
 * - 包含匹配: 位置权重 0.7 + (1 - position/input.length) * 0.3
 * - 不匹配: 0
 */
export function calculateConfidence(input: string, trigger: string): number {
  if (input === trigger) return 1.0

  const idx = input.indexOf(trigger)
  if (idx === -1) return 0

  const positionWeight = 0.7
  const proximityWeight = (1 - idx / input.length) * 0.3
  return positionWeight + proximityWeight
}

/**
 * 获取置信度 >= threshold 的最佳匹配
 * @param threshold 默认 0.4
 */
export function getTopMatch(
  input: string,
  skills: SkillMeta[],
  threshold = 0.4,
): IntentMatch | null {
  const match = matchIntent(input, skills)
  if (!match || match.confidence < threshold) return null
  return match
}
