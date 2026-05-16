<!--
  SummaryResultCard — Structured summary layout for skill output.

  When result_surface.resultKind === 'summary', use this component
  to render Markdown content with a section divider visual and copy action.
-->
<script setup lang="ts">
import { ref } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps<{
  content: string
}>()

const copied = ref(false)

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    /* clipboard write failed silently */
  }
}
</script>

<template>
  <div class="result-surface-card result-surface-card--summary">
    <div class="result-surface-card__header">
      <span class="result-surface-card__label">Summary</span>
      <button
        class="result-surface-card__copy-btn"
        :class="{ 'result-surface-card__copy-btn--copied': copied }"
        @click.stop="handleCopy"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <div class="result-surface-card__divider" />
    <div class="result-surface-card__body">
      <MarkdownRenderer :content="content" />
    </div>
  </div>
</template>

<style scoped>
.result-surface-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 6px 0;
  border: 0.5px solid var(--hc-border);
  border-radius: var(--hc-radius-xl);
  background: var(--hc-bg-card);
  box-shadow: var(--hc-shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
  animation: rsc-enter 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.result-surface-card:hover {
  box-shadow: var(--hc-shadow-md);
  border-color: var(--hc-accent);
}
@keyframes rsc-enter {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header */
.result-surface-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--hc-bg-elevated);
}
.result-surface-card__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--hc-text-primary);
  letter-spacing: -0.01em;
}
.result-surface-card__copy-btn {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid var(--hc-border);
  background: transparent;
  color: var(--hc-text-muted);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.result-surface-card__copy-btn:hover {
  background: var(--hc-accent-subtle);
  border-color: var(--hc-accent);
  color: var(--hc-accent);
}
.result-surface-card__copy-btn--copied {
  color: #16a34a;
  border-color: #16a34a;
}

/* Divider */
.result-surface-card__divider {
  height: 1px;
  background: var(--hc-border);
}

/* Body */
.result-surface-card__body {
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--hc-text-primary);
}
</style>
