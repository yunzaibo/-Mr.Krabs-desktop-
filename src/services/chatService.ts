/**
 * WebSocket streaming transport (recovery + cleanup)
 *
 * Provides resumeWebSocketStream for rejoining in-progress streams
 * after WebSocket reconnection, and clearWebSocketCallbacks for
 * cancellation cleanup. The primary chat send path now goes through
 * RuntimeBridge → RuntimeStore (request-response via Tauri IPC).
 */

import { hexclawWS, type ToolApprovalRequest } from '@/api/websocket'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { DESKTOP_USER_ID, USER_CANCELLED_MESSAGE } from '@/constants'
import type { ChatMessage } from '@/types'

const WS_FIRST_REPLY_TIMEOUT_MS = 120_000
const WS_INACTIVITY_TIMEOUT_MS = 120_000

class ChatRequestError extends Error {
  noFallback: boolean
  constructor(message: string, noFallback = false) {
    super(message)
    this.name = 'ChatRequestError'
    this.noFallback = noFallback
  }
}

// ─── Types ────────────────────────────────────────────

export interface StreamCallbacks {
  onChunk?: (content: string, reasoning?: string) => void
  onDone?: (content: string, metadata?: Record<string, unknown>, toolCalls?: ChatMessage['tool_calls'], agentName?: string) => void
  onApprovalRequest?: (request: ToolApprovalRequest) => void
  onSnapshot?: (snapshot: { content: string; reasoning?: string; metadata?: Record<string, unknown>; done?: boolean }) => void
  onMemorySaved?: (content: string) => void
}

interface StreamWsServerMessage {
  type: 'chunk' | 'reply' | 'error' | 'pong' | 'tool_approval_request' | 'memory_saved' | 'stream_snapshot'
  content: string
  reasoning?: string
  done?: boolean
  session_id?: string
  request_id?: string
  usage?: unknown
  tool_calls?: ChatMessage['tool_calls']
  metadata?: Record<string, unknown>
}

export interface WebSocketStreamResult {
  content: string
  metadata?: Record<string, unknown>
  toolCalls?: ChatMessage['tool_calls']
  agentName?: string
}

export interface WebSocketStreamHandle {
  cancel: () => void
  done: Promise<WebSocketStreamResult | null>
}

// ─── Per-request WebSocket (used by resume) ───────────

function openRequestSocket(
  sessionId: string,
  requestId: string | undefined,
  callbacks: StreamCallbacks | undefined,
  buildPayload: () => Record<string, unknown>,
): WebSocketStreamHandle {
  const url = `${env.wsBase}/ws`
  const ws = new WebSocket(url)

  let settled = false
  let firstReplyTimer: ReturnType<typeof setTimeout> | null = null
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null
  let resolveDone!: (value: WebSocketStreamResult | null) => void
  let rejectDone!: (reason?: unknown) => void

  const done = new Promise<WebSocketStreamResult | null>((resolve, reject) => {
    resolveDone = resolve
    rejectDone = reject
  })

  function clearTimers() {
    if (firstReplyTimer) {
      clearTimeout(firstReplyTimer)
      firstReplyTimer = null
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
  }

  function cleanup() {
    clearTimers()
    ws.onopen = null
    ws.onmessage = null
    ws.onerror = null
    ws.onclose = null
  }

  function settleResolve(value: WebSocketStreamResult | null) {
    if (settled) return
    settled = true
    cleanup()
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    } catch {
      // ignore close failures
    }
    resolveDone(value)
  }

  function settleReject(err: unknown) {
    if (settled) return
    settled = true
    cleanup()
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    } catch {
      // ignore close failures
    }
    rejectDone(err)
  }

  function markActivity() {
    if (firstReplyTimer) {
      clearTimeout(firstReplyTimer)
      firstReplyTimer = null
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }
    inactivityTimer = setTimeout(() => {
      settleReject(new ChatRequestError('Assistant reply stalled — no new content received.', false))
    }, WS_INACTIVITY_TIMEOUT_MS)
  }

  firstReplyTimer = setTimeout(() => {
    settleReject(new ChatRequestError('Assistant reply timed out — no response received.', false))
  }, WS_FIRST_REPLY_TIMEOUT_MS)

  ws.onopen = () => {
    ws.send(JSON.stringify(buildPayload()))
  }

  ws.onmessage = (event: MessageEvent<string>) => {
    let msg: StreamWsServerMessage
    try {
      msg = JSON.parse(event.data)
    } catch {
      logger.warn('Request WebSocket received non-JSON message', event.data)
      return
    }

    switch (msg.type) {
      case 'chunk':
        markActivity()
        callbacks?.onChunk?.(msg.content, msg.reasoning)
        if (msg.done) {
          settleResolve({
            content: '',
            metadata: msg.metadata,
            toolCalls: msg.tool_calls,
            agentName: typeof msg.metadata?.agent_name === 'string' ? msg.metadata.agent_name : undefined,
          })
        }
        break
      case 'stream_snapshot':
        markActivity()
        callbacks?.onSnapshot?.({
          content: msg.content,
          reasoning: msg.reasoning,
          metadata: msg.metadata,
          done: msg.done,
        })
        if (msg.done) {
          settleResolve({
            content: msg.content,
            metadata: msg.metadata,
            toolCalls: msg.tool_calls,
            agentName: typeof msg.metadata?.agent_name === 'string' ? msg.metadata.agent_name : undefined,
          })
        }
        break
      case 'reply':
        markActivity()
        settleResolve({
          content: msg.content,
          metadata: msg.metadata,
          toolCalls: msg.tool_calls,
          agentName: typeof msg.metadata?.agent_name === 'string' ? msg.metadata.agent_name : undefined,
        })
        break
      case 'error':
        if (msg.content === USER_CANCELLED_MESSAGE) {
          settleResolve(null)
          return
        }
        settleReject(new ChatRequestError(msg.content || 'WebSocket request failed', true))
        break
      case 'tool_approval_request':
        callbacks?.onApprovalRequest?.({
          requestId: typeof msg.request_id === 'string'
            ? msg.request_id
            : (typeof msg.metadata?.request_id === 'string' ? msg.metadata.request_id : ''),
          toolName: typeof msg.metadata?.tool_name === 'string' ? msg.metadata.tool_name : '',
          risk: typeof msg.metadata?.risk === 'string' ? msg.metadata.risk : 'sensitive',
          reason: msg.content || '',
          sessionId: msg.session_id || sessionId,
        })
        break
      case 'memory_saved':
        callbacks?.onMemorySaved?.(msg.content)
        break
      case 'pong':
        break
      default:
        logger.warn('Request WebSocket unknown message type', msg)
    }
  }

  ws.onerror = () => {
    settleReject(new ChatRequestError('WebSocket connection failed', false))
  }

  ws.onclose = () => {
    if (!settled) {
      settleReject(new ChatRequestError('WebSocket connection lost', false))
    }
  }

  return {
    cancel() {
      if (settled) return
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'cancel', session_id: sessionId, request_id: requestId }))
        }
      } catch {
        // ignore best-effort cancel failures
      }
      settleResolve(null)
    },
    done,
  }
}

// ─── Public API ───────────────────────────────────────

export function resumeWebSocketStream(
  sessionId: string,
  requestId: string,
  callbacks?: StreamCallbacks,
): WebSocketStreamHandle {
  return openRequestSocket(sessionId, requestId, callbacks, () => ({
    type: 'resume',
    session_id: sessionId,
    request_id: requestId,
    user_id: DESKTOP_USER_ID,
  }))
}

export function clearWebSocketCallbacks(): void {
  hexclawWS.clearStreamCallbacks()
}
