<script setup lang="ts">
/**
 * TaskActionBar — ContextDetailPanel 顶部操作栏。
 *
 * 3 个核心操作：Modify Instruction / Copy Result / Back to Chat。
 * P1: Modify Instruction 导航回 Chat session。
 * Phase 3: 将实现真正 re-run（通过 Runtime 状态机）。
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RotateCcw, Copy, ArrowLeft } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()

const props = defineProps<{
  chatSessionId: string | null
  primaryContent: string | null
  hasResult: boolean
}>()

const emit = defineEmits<{
  'modify-instruction': []
}>()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

function handleModifyInstruction() {
  emit('modify-instruction')
}

async function handleCopyResult() {
  if (!props.primaryContent) return
  try {
    await navigator.clipboard.writeText(props.primaryContent)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // clipboard unavailable — 静默失败
  }
}

function handleBackToChat() {
  if (props.chatSessionId) {
    router.push({ path: '/chat', query: { sessionId: props.chatSessionId } })
  }
}
</script>

<template>
  <div class="task-action-bar">
    <button
      class="task-action-bar__btn"
      :title="t('workspace.actionBar.modifyInstruction')"
      @click="handleModifyInstruction"
    >
      <RotateCcw :size="13" />
      <span>{{ t('workspace.actionBar.modifyInstruction') }}</span>
    </button>

    <button
      class="task-action-bar__btn"
      :disabled="!hasResult"
      :title="!hasResult ? t('workspace.actionBar.noResult') : (copied ? t('workspace.actionBar.copied') : t('workspace.actionBar.copyResult'))"
      @click="handleCopyResult"
    >
      <Copy :size="13" />
      <span>{{ copied ? t('workspace.actionBar.copied') : t('workspace.actionBar.copyResult') }}</span>
    </button>

    <button
      class="task-action-bar__btn"
      :disabled="!chatSessionId"
      :title="!chatSessionId ? t('workspace.actionBar.noSession') : t('workspace.actionBar.backToChat')"
      @click="handleBackToChat"
    >
      <ArrowLeft :size="13" />
      <span>{{ t('workspace.actionBar.backToChat') }}</span>
    </button>
  </div>
</template>

<style scoped>
.task-action-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--hc-divider);
}

.task-action-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: var(--hc-radius-sm, 6px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

/* Primary: filled */
.task-action-bar__btn:first-child {
  background: var(--hc-accent);
  color: #fff;
  border: 1px solid var(--hc-accent);
}

.task-action-bar__btn:first-child:hover:not(:disabled) {
  background: var(--hc-accent-hover, color-mix(in srgb, var(--hc-accent) 85%, black));
}

/* Secondary: outlined */
.task-action-bar__btn:nth-child(2) {
  background: transparent;
  color: var(--hc-accent);
  border: 1px solid var(--hc-accent);
}

.task-action-bar__btn:nth-child(2):hover:not(:disabled) {
  background: var(--hc-accent-subtle, rgba(0, 122, 255, 0.08));
}

/* Tertiary: ghost */
.task-action-bar__btn:nth-child(3) {
  background: transparent;
  color: var(--hc-text-muted);
  border: 1px solid transparent;
}

.task-action-bar__btn:nth-child(3):hover:not(:disabled) {
  color: var(--hc-text-primary);
  background: var(--hc-bg-subtle);
}

.task-action-bar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
