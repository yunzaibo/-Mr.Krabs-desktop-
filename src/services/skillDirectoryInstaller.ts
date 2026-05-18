/**
 * skillDirectoryInstaller — 完整 skill 目录导入
 *
 * 职责：
 * - 检测源目录格式（Native skill / Claude Code）
 * - 复制到 AppData/skills/{skillId}/
 * - 返回导入结果供 UI 展示
 *
 * 不做：
 * - 单个 .md 文件导入（回退到 sidecar 路径）
 * - Registry 重置（由调用方负责）
 */

import { readDir, readTextFile, writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs'
import { BaseDirectory } from '@tauri-apps/api/path'
import { sanitizeSkillId } from './skillRegistry'
import { detectClaudeCodeFormat, importClaudeCodeSkill } from './claudeCodeImporter'

// ─── Types ─────────────────────────────────────────────

export interface DirectoryInstallResult {
  success: boolean
  skillId: string
  warnings: string[]
}

// ─── Core ──────────────────────────────────────────────

/**
 * 从完整 skill 目录导入技能。
 *
 * 检测优先级：
 * 1. Native skill 目录（有 skill.json 或 SKILL.md）→ 直接复制
 * 2. Claude Code 目录（有 .claude/）→ 转换后复制
 * 3. 都不是 → 返回失败
 *
 * @param sourceDir 用户选择的源目录绝对路径
 * @returns 导入结果，包含 skillId 和警告信息
 */
export async function installSkillFromDirectory(
  sourceDir: string,
): Promise<DirectoryInstallResult> {
  const warnings: string[] = []

  // ── 场景 A: Native skill 目录 ──
  const hasSkillJson = await fileExists(`${sourceDir}/skill.json`)
  const hasSkillMd = await fileExists(`${sourceDir}/SKILL.md`)

  if (hasSkillJson || hasSkillMd) {
    return installNativeSkill(sourceDir, warnings)
  }

  // ── 场景 B: Claude Code 目录 ──
  const detection = await detectClaudeCodeFormat(sourceDir)
  if (detection.isClaudeCode) {
    return installClaudeCodeSkill(sourceDir, warnings)
  }

  // ── 场景 C: 无法识别 ──
  return {
    success: false,
    skillId: '',
    warnings: ['目录不是有效的技能格式（缺少 skill.json、SKILL.md 或 .claude/）'],
  }
}

// ─── Native Skill ──────────────────────────────────────

async function installNativeSkill(
  sourceDir: string,
  warnings: string[],
): Promise<DirectoryInstallResult> {
  // 从目录名派生 skillId
  const dirName = sourceDir.split(/[/\\]/).pop() ?? 'imported-skill'
  const skillId = sanitizeSkillId(dirName)
  if (!skillId) {
    return { success: false, skillId: '', warnings: [`无效的目录名: ${dirName}`] }
  }

  const targetDir = `skills/${skillId}`

  try {
    await mkdir(targetDir, { recursive: true, baseDir: BaseDirectory.AppData })
  } catch (e) {
    return {
      success: false,
      skillId,
      warnings: [`创建目标目录失败: ${e instanceof Error ? e.message : String(e)}`],
    }
  }

  // 复制 skill.json（如存在）
  if (await fileExists(`${sourceDir}/skill.json`)) {
    try {
      const content = await readTextFile(`${sourceDir}/skill.json`)
      await writeTextFile(`${targetDir}/skill.json`, content, { baseDir: BaseDirectory.AppData })
    } catch (e) {
      warnings.push(`复制 skill.json 失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  } else {
    // 无 skill.json → 生成最小版本
    const meta = {
      schema_version: '1.0',
      name: skillId,
      display_name: dirName,
      version: '0.1.0',
      description: '',
      capabilities: [],
      entry: 'SKILL.md',
    }
    try {
      await writeTextFile(`${targetDir}/skill.json`, JSON.stringify(meta, null, 2), {
        baseDir: BaseDirectory.AppData,
      })
    } catch (e) {
      warnings.push(`生成 skill.json 失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 复制 SKILL.md
  if (await fileExists(`${sourceDir}/SKILL.md`)) {
    try {
      const content = await readTextFile(`${sourceDir}/SKILL.md`)
      await writeTextFile(`${targetDir}/SKILL.md`, content, { baseDir: BaseDirectory.AppData })
    } catch (e) {
      warnings.push(`复制 SKILL.md 失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 复制 references/ 目录
  const refsDir = `${sourceDir}/references`
  if (await fileExists(refsDir)) {
    await copyDirectory(refsDir, `${targetDir}/references`, warnings)
  }

  return { success: true, skillId, warnings }
}

// ─── Claude Code Skill ─────────────────────────────────

async function installClaudeCodeSkill(
  sourceDir: string,
  warnings: string[],
): Promise<DirectoryInstallResult> {
  const dirName = sourceDir.split(/[/\\]/).pop() ?? 'imported-skill'
  const skillId = sanitizeSkillId(dirName)
  if (!skillId) {
    return { success: false, skillId: '', warnings: [`无效的目录名: ${dirName}`] }
  }

  // ClaudeCodeImporter 需要绝对目标路径
  // 但它的 targetDir 参数仅用于生成 skill.json，实际文件操作用 writeTextFile
  // 我们创建临时目标路径，然后手动复制到 AppData
  const tempTarget = `${sourceDir}/.hexclaw-import-temp`

  try {
    const result = await importClaudeCodeSkill(sourceDir, tempTarget)
    if (!result.success) {
      return { success: false, skillId: result.skillId || skillId, warnings: result.warnings }
    }

    // 复制到 AppData/skills/{skillId}/
    const targetDir = `skills/${result.skillId || skillId}`
    await mkdir(targetDir, { recursive: true, baseDir: BaseDirectory.AppData })

    // 复制 skill.json
    if (await fileExists(`${tempTarget}/skill.json`)) {
      const content = await readTextFile(`${tempTarget}/skill.json`)
      await writeTextFile(`${targetDir}/skill.json`, content, { baseDir: BaseDirectory.AppData })
    }

    // 复制 SKILL.md
    if (await fileExists(`${tempTarget}/SKILL.md`)) {
      const content = await readTextFile(`${tempTarget}/SKILL.md`)
      await writeTextFile(`${targetDir}/SKILL.md`, content, { baseDir: BaseDirectory.AppData })
    }

    // 复制 references/
    if (await fileExists(`${tempTarget}/references`)) {
      await copyDirectory(`${tempTarget}/references`, `${targetDir}/references`, warnings)
    }

    // 清理临时目录（best effort）
    try {
      const { remove } = await import('@tauri-apps/plugin-fs')
      await remove(tempTarget, { recursive: true })
    } catch {
      // ignore cleanup failure
    }

    return { success: true, skillId: result.skillId || skillId, warnings: result.warnings }
  } catch (e) {
    return {
      success: false,
      skillId,
      warnings: [`Claude Code 导入失败: ${e instanceof Error ? e.message : String(e)}`],
    }
  }
}

// ─── Helpers ───────────────────────────────────────────

async function fileExists(path: string): Promise<boolean> {
  try {
    return await exists(path)
  } catch {
    return false
  }
}

async function copyDirectory(
  source: string,
  target: string,
  warnings: string[],
): Promise<void> {
  try {
    await mkdir(target, { recursive: true, baseDir: BaseDirectory.AppData })
    const entries = await readDir(source)
    for (const entry of entries) {
      if (entry.isFile && entry.name) {
        try {
          const content = await readTextFile(`${source}/${entry.name}`)
          await writeTextFile(`${target}/${entry.name}`, content, { baseDir: BaseDirectory.AppData })
        } catch (e) {
          warnings.push(`复制文件 ${entry.name} 失败: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }
  } catch (e) {
    warnings.push(`复制目录失败: ${e instanceof Error ? e.message : String(e)}`)
  }
}
