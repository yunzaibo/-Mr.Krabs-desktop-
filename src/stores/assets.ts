/**
 * Asset Store — 管理 Asset 注册表、版本历史、编辑会话、Lightbox 状态。
 *
 * 纯元数据管理，不直接操作文件系统（通过 assetStorage 服务层）。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AssetRenderDTO, LightboxState, EditableDocument, VersionHistory } from '@/types/asset'

export const useAssetStore = defineStore('assets', () => {
  // --- Reactive State ---
  const registry = ref<Map<string, AssetRenderDTO>>(new Map())
  const versionHistories = ref<Map<string, VersionHistory>>(new Map())
  const editSessions = ref<Map<string, EditableDocument>>(new Map())
  const lightbox = ref<LightboxState>({
    isOpen: false,
    currentAssetId: null,
    galleryIds: [],
    currentIndex: 0,
  })

  // --- Computed ---
  const assetCount = computed(() => registry.value.size)
  const totalStorageBytes = computed(() => {
    let total = 0
    for (const asset of registry.value.values()) {
      total += asset.sizeBytes
    }
    return total
  })

  // --- Actions ---
  function registerAsset(dto: AssetRenderDTO): void {
    registry.value.set(dto.assetId, dto)
  }

  function unregisterAsset(assetId: string): void {
    registry.value.delete(assetId)
    versionHistories.value.delete(assetId)
    editSessions.value.delete(assetId)
  }

  function getAsset(assetId: string): AssetRenderDTO | undefined {
    return registry.value.get(assetId)
  }

  function updateAsset(assetId: string, updates: Partial<AssetRenderDTO>): void {
    const existing = registry.value.get(assetId)
    if (existing) {
      registry.value.set(assetId, { ...existing, ...updates })
    }
  }

  // --- Lightbox ---
  function openLightbox(assetId: string, galleryIds: string[]): void {
    const index = galleryIds.indexOf(assetId)
    lightbox.value = {
      isOpen: true,
      currentAssetId: assetId,
      galleryIds,
      currentIndex: index >= 0 ? index : 0,
    }
  }

  function closeLightbox(): void {
    lightbox.value = {
      isOpen: false,
      currentAssetId: null,
      galleryIds: [],
      currentIndex: 0,
    }
  }

  function navigateLightbox(direction: 'next' | 'prev'): void {
    const { galleryIds, currentIndex } = lightbox.value
    if (galleryIds.length === 0) return
    let newIndex = currentIndex + (direction === 'next' ? 1 : -1)
    if (newIndex < 0) newIndex = galleryIds.length - 1
    if (newIndex >= galleryIds.length) newIndex = 0
    lightbox.value.currentIndex = newIndex
    lightbox.value.currentAssetId = galleryIds[newIndex]
  }

  return {
    // State
    registry,
    versionHistories,
    editSessions,
    lightbox,
    // Computed
    assetCount,
    totalStorageBytes,
    // Actions
    registerAsset,
    unregisterAsset,
    getAsset,
    updateAsset,
    openLightbox,
    closeLightbox,
    navigateLightbox,
  }
})
