<!--
  ImageLightbox — Full-screen image viewer with zoom/navigation.
  Renders at --hc-z-overlay level, supports keyboard navigation.
-->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  currentAssetId: string | null
  currentUrl?: string
  currentIndex: number
  totalCount: number
}>()

const emit = defineEmits<{
  close: []
  navigate: [direction: 'next' | 'prev']
  zoom: [direction: 'in' | 'out']
}>()

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return
  switch (e.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowRight':
      emit('navigate', 'next')
      break
    case 'ArrowLeft':
      emit('navigate', 'prev')
      break
    case '+':
    case '=':
      emit('zoom', 'in')
      break
    case '-':
      emit('zoom', 'out')
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="lightbox-overlay"
      role="dialog"
      aria-label="Image viewer"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Backdrop -->
      <div class="lightbox-backdrop" @click="emit('close')" />

      <!-- Content -->
      <div class="lightbox-content">
        <!-- Close button -->
        <button class="lightbox-close" aria-label="Close" @click="emit('close')">
          <X :size="24" />
        </button>

        <!-- Navigation -->
        <button
          v-if="totalCount > 1"
          class="lightbox-nav lightbox-nav--prev"
          aria-label="Previous image"
          @click="emit('navigate', 'prev')"
        >
          <ChevronLeft :size="32" />
        </button>

        <!-- Image -->
        <div class="lightbox-image-container">
          <img
            v-if="currentUrl"
            :src="currentUrl"
            class="lightbox-image"
            alt="Full size image"
          />
        </div>

        <button
          v-if="totalCount > 1"
          class="lightbox-nav lightbox-nav--next"
          aria-label="Next image"
          @click="emit('navigate', 'next')"
        >
          <ChevronRight :size="32" />
        </button>

        <!-- Counter -->
        <div class="lightbox-counter">
          {{ currentIndex + 1 }} / {{ totalCount }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--hc-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
}

.lightbox-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.lightbox-close {
  position: absolute;
  top: var(--hc-space-4);
  right: var(--hc-space-4);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-nav--prev {
  left: var(--hc-space-4);
}

.lightbox-nav--next {
  right: var(--hc-space-4);
}

.lightbox-image-container {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--hc-radius-md);
}

.lightbox-counter {
  position: absolute;
  bottom: var(--hc-space-4);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-sm);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
}

.lightbox-overlay button:focus-visible {
  outline: 2px solid var(--hc-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-backdrop,
  .lightbox-nav,
  .lightbox-close {
    transition: none;
  }
}
</style>
