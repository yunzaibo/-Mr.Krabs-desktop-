<!--
  AssetToast — Toast notification for storage feedback.
-->
<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <div class="toast" :class="`toast--${variant}`" role="alert" aria-live="polite">
    <span class="toast__message">{{ message }}</span>
    <button class="toast__close hc-btn hc-btn-ghost" aria-label="Dismiss" @click="emit('dismiss')">
      <X :size="14" />
    </button>
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-3);
  padding: var(--hc-space-3) var(--hc-space-4);
  border-radius: var(--hc-radius-md);
  background: var(--hc-bg-elevated);
  border: 1px solid var(--hc-border);
  min-width: 250px;
  max-width: 400px;
  animation: toast-slide-in 0.2s ease-out;
}

.toast--success {
  border-left: 3px solid var(--hc-success);
}

.toast--error {
  border-left: 3px solid var(--hc-error);
}

.toast--warning {
  border-left: 3px solid var(--hc-warning);
}

.toast--info {
  border-left: 3px solid var(--hc-accent);
}

.toast__message {
  font-size: 13px;
  color: var(--hc-text-primary);
  flex: 1;
}

.toast__close {
  flex-shrink: 0;
  padding: 2px;
}

.toast button:focus-visible {
  outline: 2px solid var(--hc-accent);
  outline-offset: 2px;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
}
</style>
