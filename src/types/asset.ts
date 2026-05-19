/**
 * Asset Runtime 类型定义
 *
 * Runtime Resource Reference — 非 Semantic Layer。
 * Asset Reference 是 Context 中的轻量资产指针。
 *
 * 不是：File Manager / Media Library / Object Storage / Upload Center。
 */

// ─── Asset 类型 ─────────────────────────────────────────

/** Asset 类型 — 严格有限枚举 */
export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'other'

// ─── Asset 状态 ─────────────────────────────────────────

/**
 * Asset 生命周期 — 4 态。
 *
 * registered → active → orphaned → invalidated
 *
 * registerAsset() 默认 status = 'registered'。
 * checkAssetHealth() 仅 observation，不修改 status。
 */
export type AssetStatus = 'registered' | 'active' | 'orphaned' | 'invalidated'

// ─── AssetReference ────────────────────────────────────

/**
 * AssetReference — Context 中存储的轻量资产指针。
 *
 * assetId = Runtime identity（authoritative）
 * path    = external filesystem pointer（非 authoritative）
 *
 * 约束：
 * - 不包含文件内容 / base64 / blob
 * - metadata 不可变（创建时固化）
 * - 多个 AssetReference 可以指向同一 path（不做 dedupe）
 */
export interface AssetReference {
  /** Runtime identity（UUID） */
  assetId: string
  /** 资产类型 */
  type: AssetType
  /** 文件绝对路径（external pointer，非 identity） */
  path: string
  /** 不可变元数据 */
  metadata: AssetMetadata
  /** 生命周期状态 */
  status: AssetStatus
  /** 所属 Task */
  taskId: string
  /** 创建时间（ISO） */
  createdAt: string
}

// ─── AssetMetadata ─────────────────────────────────────

/**
 * AssetMetadata — 声明式元数据。
 *
 * 创建时固化，不保证与真实文件一致。
 * Phase 9 不做：mime sniffing / media parsing / content validation。
 */
export interface AssetMetadata {
  /** 原始文件名 */
  originalName: string
  /** MIME type（声明式，非 sniffing 结果） */
  mimeType: string
  /** 文件大小 bytes（声明式） */
  sizeBytes: number
  /** 生成来源（如 'image_generation'） */
  source: string
  /** 可选：图片尺寸 */
  dimensions?: { width: number; height: number }
  /** 可选：音视频时长（秒） */
  durationSeconds?: number
}

// ─── AssetHandle ───────────────────────────────────────

/**
 * AssetHandle — 最小运行时句柄。
 * Phase 9 仅允许 exists()。
 */
export interface AssetHandle {
  readonly ref: AssetReference
  exists(): Promise<boolean>
}

// ─── AssetCollection ───────────────────────────────────

/**
 * AssetCollection — per-context 资产集合。
 *
 * 不做 auto dedupe。多 ref 可指向同一 path。
 * summary 不持久化，动态 rebuild。
 * lastUpdated 仅 observability metadata，不保证与文件系统同步。
 */
export interface AssetCollection {
  /** 资产引用列表 */
  refs: AssetReference[]
  /**
   * 最后修改时间（ISO）。
   * observability metadata only — 不保证与真实 filesystem 同步。
   */
  lastUpdated: string
}

// ─── UI Rendering Types (G9 Asset UI) ───────────────────

/** UI Asset 类型 — 用于渲染路由 */
export type UIAssetType = 'image' | 'file' | 'markdown'

/**
 * AssetMeta — AssetResultCard 的简化输入 props。
 * 与 AssetMetadata（存储层）分离，UI 层不依赖存储实现。
 */
export interface AssetMeta {
  assetType: UIAssetType
  fileName?: string
  fileSize?: number
  fileUrl?: string
}

/**
 * AssetRenderDTO — UI 层投影模型。
 * 从 AssetReference + AssetMetadata 派生，纯只读。
 */
export interface AssetRenderDTO {
  assetId: string
  assetType: UIAssetType
  fileName: string
  fileSizeFormatted: string
  sizeBytes: number
  mimeType: string
  contentUrl?: string
  editable: boolean
  hasVersions: boolean
  contentHash: string
}

// ─── Edit Lock ──────────────────────────────────────────

/** 轻量级元数据锁 — 单用户桌面应用 */
export interface EditLock {
  locked: boolean
  lockedAt?: string
  lockedBy?: string
}

// ─── Version Control ────────────────────────────────────

/** 快照版本 — 每次修改创建完整快照 */
export interface SnapshotVersion {
  versionNumber: number
  createdAt: string
  contentHash: string
  description?: string
  sizeBytes: number
}

/** 版本历史 — per-asset 版本记录 */
export interface VersionHistory {
  assetId: string
  versions: SnapshotVersion[]
  maxVersions: number
}

// ─── Editor State ───────────────────────────────────────

/** 可编辑文档 — 编辑器打开时的运行时状态 */
export interface EditableDocument {
  assetId: string
  content: string
  originalHash: string
  isDirty: boolean
  openedAt: string
}

// ─── Lightbox State ─────────────────────────────────────

/** Lightbox 运行时状态 */
export interface LightboxState {
  isOpen: boolean
  currentAssetId: string | null
  galleryIds: string[]
  currentIndex: number
}

// ─── Utility Functions ──────────────────────────────────

/**
 * 格式化文件大小为人类可读字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

/**
 * 根据 MIME type 分类 Asset 渲染类型
 */
export function classifyAssetType(mimeType: string): UIAssetType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') return 'markdown'
  return 'file'
}
