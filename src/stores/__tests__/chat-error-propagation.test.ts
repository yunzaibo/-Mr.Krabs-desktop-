import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, type Ref } from 'vue'

// ─── Constants ──────────────────────────────────────

const mockSending = ref(true)
const mockDraftSending = ref(false)

// ─── Factory ────────────────────────────────────────

function createTestController(overrides?: {
  error?: Ref<any>
  currentSessionId?: string
  streamingSessionId?: string | null
}) {
  const error = overrides?.error ?? ref(null)
  return createChatStreamErrorController({
    error,
    currentSessionId: ref(overrides?.currentSessionId ?? 'current-s1'),
    streamingSessionId: ref(overrides?.streamingSessionId ?? null),
    logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any,
    createId: mockCreateId,
    appendMessageToSession: mockAppendMessage,
    resetSessionStream: mockResetSessionStream,
    loadSessions: mockLoadSessions,
  })
}

// ─── Shared Mocks ───────────────────────────────────

const mockAppendMessage = vi.fn()
const mockResetSessionStream = vi.fn()
const mockLoadSessions = vi.fn()
const mockCreateId = vi.fn(() => 'test-id-1')

// ─── Imports (after vi.mock removal) ────────────────

import { createChatStreamErrorController } from '../chat-stream-error'
import {
  createApiError,
  createBridgeError,
  fromHttpStatus,
  fromNativeError,
  isRetryable,
} from '@/utils/errors'
import { bridgeErrorToApiError } from '@/services/runtimeBridge'

describe('handleSendError input types', () => {
  let controller: ReturnType<typeof createChatStreamErrorController>
  let error: Ref<any>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    error = ref(null)
    controller = createTestController({ error })
  })

  it('plain Error → UNKNOWN via fromNativeError', () => {
    controller.handleSendError(new Error('network down'), 's1', mockSending, mockDraftSending)
    expect(error.value).toMatchObject({ code: 'UNKNOWN', message: 'network down' })
  })

  it('ApiError from WS path → passthrough', () => {
    const apiErr = createApiError('RATE_LIMITED', '请求过于频繁', 429)
    controller.handleSendError(apiErr, 's1', mockSending, mockDraftSending)
    expect(error.value).toStrictEqual(apiErr)
  })

  it('ApiError from RT path → passthrough', () => {
    const apiErr = createApiError('SERVER_ERROR', '执行器内部错误')
    controller.handleSendError(apiErr, 's1', mockSending, mockDraftSending)
    expect(error.value).toStrictEqual(apiErr)
  })

  it('string error → UNKNOWN', () => {
    controller.handleSendError('raw string', 's1', mockSending, mockDraftSending)
    expect(error.value).toMatchObject({ code: 'UNKNOWN', message: 'raw string' })
  })

  it('null → UNKNOWN with fallback message', () => {
    controller.handleSendError(null, 's1', mockSending, mockDraftSending)
    expect(error.value).toMatchObject({ code: 'UNKNOWN' })
  })

  it('empty message → fallback to default', () => {
    controller.handleSendError({ code: 'TIMEOUT', message: '' }, 's1', mockSending, mockDraftSending)
    expect(mockAppendMessage).toHaveBeenCalledWith('s1', expect.objectContaining({
      content: '发送失败，请检查 hexclaw 引擎是否运行',
    }))
  })
})

describe('session fallback chain', () => {
  let error: Ref<any>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    error = ref(null)
  })

  it('uses provided sessionId', () => {
    const controller = createTestController({
      error,
      currentSessionId: 'current-s1',
      streamingSessionId: 'stream-s1',
    })
    controller.handleSendError(new Error('fail'), 'provided-s1', mockSending, mockDraftSending)
    expect(mockResetSessionStream).toHaveBeenCalledWith('provided-s1', expect.anything(), expect.anything())
  })

  it('falls back to streamingSessionId when sessionId is null', () => {
    const controller = createTestController({
      error,
      currentSessionId: 'current-s1',
      streamingSessionId: 'stream-s1',
    })
    controller.handleSendError(new Error('fail'), null, mockSending, mockDraftSending)
    expect(mockResetSessionStream).toHaveBeenCalledWith('stream-s1', expect.anything(), expect.anything())
  })

  it('falls back to currentSessionId when both are null', () => {
    const controller = createTestController({
      error,
      currentSessionId: 'current-s1',
      streamingSessionId: null,
    })
    controller.handleSendError(new Error('fail'), null, mockSending, mockDraftSending)
    expect(mockResetSessionStream).toHaveBeenCalledWith('current-s1', expect.anything(), expect.anything())
  })
})

describe('semantic equivalence', () => {
  it('WS HTTP 500 and RT RT_TASK_FAILED both produce SERVER_ERROR', () => {
    // WS path: HTTP 500
    const wsErr = fromHttpStatus(500)
    // RT path: RT_TASK_FAILED → SERVER_ERROR
    const rtBridgeErr = createBridgeError({ code: 'RT_TASK_FAILED', message: '执行器内部错误' })
    const rtErr = bridgeErrorToApiError(rtBridgeErr)

    expect(wsErr.code).toBe(rtErr.code)
    expect(wsErr.code).toBe('SERVER_ERROR')
  })

  it('WS AbortError and RT RT_TIMEOUT both produce TIMEOUT', () => {
    // WS path: AbortError
    const abortErr = new DOMException('aborted', 'AbortError')
    const wsApiErr = fromNativeError(abortErr)
    // RT path: RT_TIMEOUT → TIMEOUT
    const rtBridgeErr = createBridgeError({ code: 'RT_TIMEOUT', message: '执行超时' })
    const rtApiErr = bridgeErrorToApiError(rtBridgeErr)

    expect(wsApiErr.code).toBe(rtApiErr.code)
    expect(wsApiErr.code).toBe('TIMEOUT')
  })

  it('SSE 429 (after F-001) and RT_TIMEOUT are both retryable', () => {
    // WS path: SSE 429
    const sseErr = fromHttpStatus(429)
    // RT path: RT_TIMEOUT → TIMEOUT
    const rtBridgeErr = createBridgeError({ code: 'RT_TIMEOUT', message: '执行超时' })
    const rtErr = bridgeErrorToApiError(rtBridgeErr)

    expect(isRetryable(sseErr)).toBe(true)
    expect(isRetryable(rtErr)).toBe(true)
  })

  it('RT_CANCELLED is NOT retryable (after F-002)', () => {
    const bridgeErr = createBridgeError({ code: 'RT_CANCELLED', message: '操作已取消' })
    const apiErr = bridgeErrorToApiError(bridgeErr)

    expect(apiErr.code).toBe('CANCELLED')
    expect(isRetryable(apiErr)).toBe(false)
  })
})
