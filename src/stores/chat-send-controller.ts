import type { Ref } from 'vue'
import { DEFAULT_SESSION_TITLE } from '@/constants'
import type { ChatAttachment, ChatMessage } from '@/types'
import type { Task } from '@/types'
import { useTaskStore } from '@/stores/tasks'
import { useChatStore } from '@/stores/chat'
import { registerChatTask, executeChatTask } from '@/services/runtimeBridge'
import { buildAssistantMessage } from '@/utils/buildAssistantMessage'
import type { TaskCardMetadata } from '@/types/taskCard'
// ResultSurfaceMetadata import removed — unused after G4 cleanup
import { createChatSendAutoTitleController } from './chat-send-auto-title'
import { shouldBlockChatSend, shouldSeedChatAutoTitle } from './chat-send-guards'
import { tryExecuteSkill } from '@/services/skillBridge'

type MessageServiceModule = typeof import('@/services/messageService')

export function createChatSendController(params: {
  currentSessionId: Ref<string | null>
  messages: Ref<ChatMessage[]>
  pendingSessionIds: Ref<Record<string, boolean>>
  draftSending: Ref<boolean>
  hasCustomTitle: Ref<boolean>
  sessions: Ref<import('@/types').ChatSession[]>
  msgSvc: MessageServiceModule
  createId: () => string
  defaultSessionTitle?: string
  ensureSession: () => Promise<string>
  clearSessionCancelled: (sessionId: string) => void
  isSessionCancelled: (sessionId: string) => boolean
  isSessionStreaming: (sessionId: string) => boolean
  refreshSendingState: (sending: Ref<boolean>, draftSending: Ref<boolean>) => void
  setLocalSessionTitle: (sessionId: string, title: string) => void
  setPendingSuggestedTitleExpectation: (sessionId: string, expectedTitle: string | null) => void
  pendingSuggestedTitleExpectation: Ref<Record<string, string>>
  pendingAutoTitleSync: Map<string, Promise<void>>
  persistMessage: (message: ChatMessage, sessionId: string) => Promise<boolean>
  handleSendError: (
    errorValue: unknown,
    sessionId: string | null | undefined,
    sending: Ref<boolean>,
    draftSending: Ref<boolean>,
  ) => void
  sending: Ref<boolean>
}) {
  const {
    currentSessionId,
    messages,
    pendingSessionIds,
    draftSending,
    hasCustomTitle,
    sessions,
    msgSvc,
    createId,
    defaultSessionTitle = DEFAULT_SESSION_TITLE,
    ensureSession,
    clearSessionCancelled: _clearSessionCancelled,
    isSessionCancelled: _isSessionCancelled,
    isSessionStreaming,
    refreshSendingState,
    setLocalSessionTitle,
    setPendingSuggestedTitleExpectation,
    pendingSuggestedTitleExpectation,
    pendingAutoTitleSync,
    persistMessage,
    handleSendError,
    sending,
  } = params

  const autoTitleController = createChatSendAutoTitleController({
    msgSvc,
    pendingAutoTitleSync,
    setLocalSessionTitle,
    setPendingSuggestedTitleExpectation,
    defaultSessionTitle,
  })

  async function sendMessage(
    text: string,
    attachments?: ChatAttachment[],
    options?: { backendText?: string },
  ): Promise<ChatMessage | null> {
    const initialSessionId = currentSessionId.value
    const shouldSeedAutoTitle = shouldSeedChatAutoTitle({
      hasCustomTitle: hasCustomTitle.value,
      initialSessionId,
      messages: messages.value,
      sessions: sessions.value,
      defaultSessionTitle,
    })
    if (shouldBlockChatSend({
      initialSessionId,
      pendingSessionIds: pendingSessionIds.value,
      draftSending: draftSending.value,
      isSessionStreaming,
    })) {
      return null
    }
    draftSending.value = !initialSessionId
    refreshSendingState(sending, draftSending)

    // ── Skill Invocation 检测 ──────────────────────
    const skillMsg = await tryExecuteSkill(text, {
      createId,
      messages,
      sending,
      draftSending,
      handleSendError,
    })
    if (skillMsg !== undefined) return skillMsg

    // ── Task 生命周期注册 ──────────────────────────────
    const $taskId = createId()
    const $taskStore = useTaskStore()
    const $chatStore = useChatStore()
    let placeholderId: string | null = null
    let runtimeStartedAt = 0
    const $chatTask: Task = {
      id: $taskId,
      type: 'chat',
      status: 'running',
      input: { type: 'chat', payload: { text, backendText: options?.backendText, attachments } },
    }
    $taskStore.enqueue($chatTask)
    registerChatTask($chatTask)

    try {
      const requestId = $taskId
      const userMessage: ChatMessage = {
        id: requestId,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
        metadata: attachments?.length ? { attachments } : undefined,
      }
      messages.value.push(userMessage)

      placeholderId = createId()
      const placeholderMetadata: TaskCardMetadata = {
        kind: 'task-card',
        taskId: $taskId,
        skillId: 'chat',
        skillName: 'Chat',
        status: 'running',
        elapsed: 0,
        resultKind: 'text',
        lastEvent: '任务已入队',
        previewEvents: ['任务已入队'],
      }
      const placeholderMsg: ChatMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        metadata: placeholderMetadata as unknown as Record<string, unknown>,
      }
      messages.value.push(placeholderMsg)

      const sessionId = await ensureSession()
      $chatTask.sessionId = sessionId
      $chatTask.metadata = { source: 'chat', createdAt: new Date().toISOString() }
      // ensureSession 完成后立即释放 draftSending，不再阻塞后续发送
      draftSending.value = false
      refreshSendingState(sending, draftSending)
      if (pendingSessionIds.value[sessionId] || isSessionStreaming(sessionId)) {
        $taskStore.cancelTask($taskId)
        return null
      }

      if (shouldSeedAutoTitle) {
        autoTitleController.seedAutoTitle(sessionId, text)
      }

      // 持久化与发送并行，失败不阻塞（persistMessage 内部已有日志）
      void persistMessage(userMessage, sessionId).catch(() => {})

      // ── Runtime 执行（唯一路径）──────────────────────
      runtimeStartedAt = Date.now()
      const result = await executeChatTask($taskId)
      const elapsed = Date.now() - runtimeStartedAt
      const assistantMsg = buildAssistantMessage(result.content, {
        id: placeholderId ?? createId(),
        metadata: ({
          kind: 'task-card',
          taskId: $taskId,
          skillId: 'chat',
          skillName: 'Chat',
          status: 'completed',
          elapsed,
          resultKind: 'text',
          resultPreview: result.content?.substring(0, 200),
          lastEvent: '完成',
          previewEvents: [`完成 · ${(elapsed / 1000).toFixed(1)}s`],
        } satisfies TaskCardMetadata) as unknown as Record<string, unknown>,
      })
      if (placeholderId) {
        await $chatStore.updateMessage(placeholderId, (current) => ({
          ...current,
          content: assistantMsg.content,
          reasoning: assistantMsg.reasoning,
          tool_calls: assistantMsg.tool_calls,
          agent_name: assistantMsg.agent_name,
          metadata: assistantMsg.metadata,
        }))
      } else {
        messages.value.push(assistantMsg)
        void persistMessage(assistantMsg, sessionId).catch(() => {})
      }

      // D1: Auto-title suggestion
      const shouldSuggestTitle = !!pendingSuggestedTitleExpectation.value[sessionId]
      setPendingSuggestedTitleExpectation(sessionId, null)
      void (async () => {
        if (shouldSuggestTitle) {
          const titleSync = pendingAutoTitleSync.get(sessionId)
          if (titleSync) await titleSync
          const result = await msgSvc.suggestSessionTitle?.(sessionId, '')
          if (result?.updated && result.title) {
            setLocalSessionTitle(sessionId, result.title)
          }
        }
      })()

      return assistantMsg
    } catch (e) {
      // executeChatTask 内部已处理 TaskStore fail + Runtime timeline
      if (placeholderId) {
        try {
          await $chatStore.updateMessage(placeholderId, (current) => ({
            ...current,
            metadata: ({
              kind: 'task-card',
              taskId: $taskId,
              skillId: 'chat',
              skillName: 'Chat',
              status: 'failed',
              elapsed: runtimeStartedAt ? Date.now() - runtimeStartedAt : undefined,
              resultKind: 'text',
              lastEvent: '失败',
              previewEvents: ['执行失败'],
            } satisfies TaskCardMetadata) as unknown as Record<string, unknown>,
          }))
        } catch {
          // ignore placeholder update failure
        }
      }
      handleSendError(e, currentSessionId.value, sending, draftSending)
      return null
    } finally {
      draftSending.value = false
      refreshSendingState(sending, draftSending)
    }
  }

  return {
    sendMessage,
  }
}
