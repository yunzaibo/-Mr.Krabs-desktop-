/**
 * Asset Storage Abstraction Layer
 *
 * Tauri FS 操作封装：atomicWrite、路径验证、文件锁。
 * 上层（Pinia Store）通过此层访问文件系统，不直接调用 Tauri invoke。
 */
import { invoke } from '@tauri-apps/api/core'
import type { EditLock } from '@/types/asset'
import { formatFileSize, classifyAssetType } from '@/types/asset'

export { formatFileSize, classifyAssetType }

const LOCK_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Validate asset path 安全性 — 禁止 .., 绝对路径, 特殊字符
 */
export function validateAssetPath(path: string): boolean {
  if (path.includes('..')) return false
  if (path.startsWith('/')) return false
  if (path.startsWith('~')) return false
  if (!/^[a-zA-Z0-9_\-./]+$/.test(path)) return false
  return true
}

/**
 * Atomic write: temp file + rename to prevent corruption on crash
 */
export async function atomicWrite(targetPath: string, content: string): Promise<void> {
  const tmpPath = `${targetPath}.tmp`
  try {
    await invoke('write_text_file', { path: tmpPath, contents: content })
    await invoke('rename_file', { from: tmpPath, to: targetPath })
  } catch (error) {
    try {
      await invoke('delete_file', { path: tmpPath })
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Read file content via Tauri FS
 */
export async function readAssetFile(storagePath: string): Promise<string> {
  return invoke<string>('read_text_file', { path: storagePath })
}

/**
 * Check if file exists
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    await invoke<number>('get_file_size', { path: storagePath })
    return true
  } catch {
    return false
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(storagePath: string): Promise<number> {
  return invoke<number>('get_file_size', { path: storagePath })
}

/**
 * Delete file
 */
export async function deleteAssetFile(storagePath: string): Promise<void> {
  await invoke('delete_file', { path: storagePath })
}

/**
 * Ensure asset directory exists
 */
export async function ensureAssetDirectory(assetId: string): Promise<void> {
  const dirPath = getAssetDir() + '/' + assetId
  await invoke('create_directory', { path: dirPath, recursive: true })
}

/**
 * Get asset base directory
 */
export function getAssetDir(): string {
  return '.hexclaw/assets'
}

/**
 * Acquire metadata-level edit lock
 */
export async function acquireLock(
  assetId: string,
  holderId: string,
  timeoutMs: number = LOCK_TIMEOUT_MS,
): Promise<boolean> {
  const lockPath = `${getAssetDir()}/${assetId}/_meta.json`
  try {
    const content = await readAssetFile(lockPath)
    const meta = JSON.parse(content)
    if (meta.editLock?.locked) {
      const lockTime = new Date(meta.editLock.lockedAt).getTime()
      const now = Date.now()
      if (now - lockTime > timeoutMs) {
        meta.editLock = { locked: true, lockedAt: new Date().toISOString(), lockedBy: holderId }
        await atomicWrite(lockPath, JSON.stringify(meta))
        return true
      }
      if (meta.editLock.lockedBy !== holderId) {
        return false
      }
    }
    meta.editLock = { locked: true, lockedAt: new Date().toISOString(), lockedBy: holderId }
    await atomicWrite(lockPath, JSON.stringify(meta))
    return true
  } catch {
    const meta = { editLock: { locked: true, lockedAt: new Date().toISOString(), lockedBy: holderId } }
    await atomicWrite(lockPath, JSON.stringify(meta))
    return true
  }
}

/**
 * Release metadata-level edit lock
 */
export async function releaseLock(assetId: string, holderId: string): Promise<void> {
  const lockPath = `${getAssetDir()}/${assetId}/_meta.json`
  try {
    const content = await readAssetFile(lockPath)
    const meta = JSON.parse(content)
    if (meta.editLock?.lockedBy === holderId) {
      meta.editLock = { locked: false }
      await atomicWrite(lockPath, JSON.stringify(meta))
    }
  } catch {
    // Ignore release errors
  }
}

/**
 * Check lock status
 */
export async function checkLock(assetId: string): Promise<EditLock | null> {
  const lockPath = `${getAssetDir()}/${assetId}/_meta.json`
  try {
    const content = await readAssetFile(lockPath)
    const meta = JSON.parse(content)
    return meta.editLock || null
  } catch {
    return null
  }
}
