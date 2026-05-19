import { describe, it, expect } from 'vitest'
import type { BridgeErrorCode, BridgeError } from '@/types/error'

describe('BridgeError types', () => {
  it('BridgeErrorCode is exported from @/types/error with correct codes', () => {
    // This import will fail at type-check time if BridgeErrorCode doesn't exist.
    // At runtime, we verify the type by checking createBridgeError produces valid codes.
    const codes: BridgeErrorCode[] = [
      'RT_TASK_FAILED',
      'RT_NO_OUTPUT',
      'RT_ILLEGAL_TRANSITION',
      'RT_TIMEOUT',
      'RT_CANCELLED',
      'BRIDGE_INTERNAL',
    ]
    expect(codes).toHaveLength(6)
  })

  it('BridgeError has __brand field', () => {
    const err: BridgeError = {
      __brand: 'BridgeError',
      code: 'RT_TASK_FAILED',
      message: 'test',
    }
    expect(err.__brand).toBe('BridgeError')
  })
})

// ─── These tests will fail until Task 2 implements the functions ───

describe('createBridgeError (requires Task 2)', () => {
  it('creates error with correct brand', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'test' })
    expect(err.__brand).toBe('BridgeError')
  })

  it('creates error with correct code', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const err = createBridgeError({ code: 'RT_NO_OUTPUT', message: 'test' })
    expect(err.code).toBe('RT_NO_OUTPUT')
  })

  it('creates error with correct message', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'custom msg' })
    expect(err.message).toBe('custom msg')
  })

  it('creates error with cause', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const original = new Error('original')
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'test', cause: original })
    expect(err.cause).toBe(original)
  })

  it('creates error without cause', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'test' })
    expect(err.cause).toBeUndefined()
  })
})

describe('isBridgeError (requires Task 2)', () => {
  it('returns true for valid BridgeError', async () => {
    const { createBridgeError, isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError(createBridgeError({ code: 'RT_TASK_FAILED', message: 'test' }))).toBe(true)
  })

  it('returns false for null', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError(null)).toBe(false)
  })

  it('returns false for undefined', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError(undefined)).toBe(false)
  })

  it('returns false for string', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError('error')).toBe(false)
  })

  it('returns false for Error object', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError(new Error('test'))).toBe(false)
  })

  it('returns false for object without __brand', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError({ code: 'RT_TASK_FAILED', message: 'test' })).toBe(false)
  })

  it('returns false for object with wrong __brand', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError({ __brand: 'Wrong', code: 'RT_TASK_FAILED', message: 'test' })).toBe(false)
  })

  it('returns false for object without code', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError({ __brand: 'BridgeError', message: 'test' })).toBe(false)
  })

  it('returns false for object without message', async () => {
    const { isBridgeError } = await import('@/utils/errors')
    expect(isBridgeError({ __brand: 'BridgeError', code: 'RT_TASK_FAILED' })).toBe(false)
  })
})

// ─── Mapping tests (require Task 3) ───

describe('bridgeErrorToApiError', () => {
  const testCases: Array<{
    input: BridgeErrorCode
    expectedApiCode: string
    description: string
  }> = [
    { input: 'RT_TASK_FAILED', expectedApiCode: 'SERVER_ERROR', description: '执行失败映射到 SERVER_ERROR' },
    { input: 'RT_NO_OUTPUT', expectedApiCode: 'SERVER_ERROR', description: '无输出映射到 SERVER_ERROR' },
    { input: 'RT_ILLEGAL_TRANSITION', expectedApiCode: 'SERVER_ERROR', description: '非法转换映射到 SERVER_ERROR' },
    { input: 'RT_TIMEOUT', expectedApiCode: 'TIMEOUT', description: '超时映射到 TIMEOUT' },
    { input: 'RT_CANCELLED', expectedApiCode: 'CANCELLED', description: '取消映射到 CANCELLED' },
    { input: 'BRIDGE_INTERNAL', expectedApiCode: 'UNKNOWN', description: '桥接内部错误映射到 UNKNOWN' },
  ]

  testCases.forEach(({ input, expectedApiCode, description }) => {
    it(`maps ${input} → ${expectedApiCode} (${description})`, async () => {
      const { createBridgeError } = await import('@/utils/errors')
      const { bridgeErrorToApiError } = await import('@/services/runtimeBridge')
      const bridgeError = createBridgeError({
        code: input,
        message: `test error: ${input}`,
        cause: new Error('original'),
      })
      const apiError = bridgeErrorToApiError(bridgeError)
      expect(apiError.code).toBe(expectedApiCode)
      expect(apiError.message).toBe(bridgeError.message)
      expect(apiError.cause).toBe(bridgeError.cause)
    })
  })

  it('preserves cause chain', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const { bridgeErrorToApiError } = await import('@/services/runtimeBridge')
    const original = new Error('original')
    const bridgeError = createBridgeError({ code: 'RT_TASK_FAILED', message: 'wrapped', cause: original })
    const apiError = bridgeErrorToApiError(bridgeError)
    expect(apiError.cause).toBe(original)
  })

  it('handles undefined cause', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const { bridgeErrorToApiError } = await import('@/services/runtimeBridge')
    const bridgeError = createBridgeError({ code: 'RT_NO_OUTPUT', message: 'no output' })
    const apiError = bridgeErrorToApiError(bridgeError)
    expect(apiError.message).toBe('no output')
    expect(apiError.cause).toBeUndefined()
  })
})

describe('BRIDGE_TO_API_MAP snapshot', () => {
  it('matches snapshot', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const { bridgeErrorToApiError } = await import('@/services/runtimeBridge')
    const allCodes: BridgeErrorCode[] = [
      'RT_TASK_FAILED', 'RT_NO_OUTPUT', 'RT_ILLEGAL_TRANSITION',
      'RT_TIMEOUT', 'RT_CANCELLED', 'BRIDGE_INTERNAL',
    ]
    const results = allCodes.map(code => {
      const err = createBridgeError({ code, message: 'snapshot' })
      return { code, apiCode: bridgeErrorToApiError(err).code }
    })
    expect(results).toMatchSnapshot()
  })
})

// ─── canTransition tests ───

describe('canTransition', () => {
  const legalTransitions: Array<[string, string]> = [
    ['idle', 'preparing'],
    ['preparing', 'running'],
    ['running', 'completed'],
    ['running', 'failed'],
  ]

  const illegalTransitions: Array<[string, string]> = [
    ['completed', 'running'],
    ['completed', 'preparing'],
    ['completed', 'idle'],
    ['failed', 'running'],
    ['failed', 'preparing'],
    ['failed', 'idle'],
    ['running', 'preparing'],
    ['running', 'idle'],
    ['preparing', 'idle'],
    ['preparing', 'completed'],
  ]

  legalTransitions.forEach(([from, to]) => {
    it(`allows ${from} → ${to}`, async () => {
      const { canTransition } = await import('@/types/execution')
      expect(canTransition(from as any, to as any)).toBe(true)
    })
  })

  illegalTransitions.forEach(([from, to]) => {
    it(`rejects ${from} → ${to}`, async () => {
      const { canTransition } = await import('@/types/execution')
      expect(canTransition(from as any, to as any)).toBe(false)
    })
  })
})

describe('CANCELLED error code', () => {
  it('is included in ApiErrorCode', async () => {
    const { createApiError } = await import('@/utils/errors')
    const err = createApiError('CANCELLED', '操作已取消')
    expect(err.code).toBe('CANCELLED')
  })

  it('RT_CANCELLED maps to CANCELLED (not SERVER_ERROR)', async () => {
    const { createBridgeError } = await import('@/utils/errors')
    const { bridgeErrorToApiError } = await import('@/services/runtimeBridge')
    const bridgeErr = createBridgeError({ code: 'RT_CANCELLED', message: '操作已取消' })
    const apiErr = bridgeErrorToApiError(bridgeErr)
    expect(apiErr.code).toBe('CANCELLED')
  })

  it('CANCELLED is not retryable', async () => {
    const { createApiError, isRetryable } = await import('@/utils/errors')
    const err = createApiError('CANCELLED', '操作已取消')
    expect(isRetryable(err)).toBe(false)
  })
})
