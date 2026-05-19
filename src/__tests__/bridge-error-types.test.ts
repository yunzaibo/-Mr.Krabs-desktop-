import { describe, it, expect } from 'vitest'
import type { BridgeErrorCode, BridgeError, ApiErrorCode } from '@/types/error'
import type { ExecutionState } from '@/types/execution'
import { createBridgeError, isBridgeError, createApiError, isRetryable } from '@/utils/errors'
import { bridgeErrorToApiError } from '@/services/runtimeBridge'
import { canTransition } from '@/types/execution'

const ALL_BRIDGE_ERROR_CODES: BridgeErrorCode[] = [
  'RT_TASK_FAILED', 'RT_NO_OUTPUT', 'RT_ILLEGAL_TRANSITION',
  'RT_TIMEOUT', 'RT_CANCELLED', 'BRIDGE_INTERNAL',
]

describe('BridgeError types', () => {
  it('BridgeErrorCode is exported from @/types/error with correct codes', () => {
    expect(ALL_BRIDGE_ERROR_CODES).toHaveLength(6)
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

describe('createBridgeError', () => {
  it('creates error with correct brand', () => {
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'test' })
    expect(err.__brand).toBe('BridgeError')
  })

  it('creates error with correct code', () => {
    const err = createBridgeError({ code: 'RT_NO_OUTPUT', message: 'test' })
    expect(err.code).toBe('RT_NO_OUTPUT')
  })

  it('creates error with correct message', () => {
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'custom msg' })
    expect(err.message).toBe('custom msg')
  })

  it('creates error with cause', () => {
    const original = new Error('original')
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'test', cause: original })
    expect(err.cause).toBe(original)
  })

  it('creates error without cause', () => {
    const err = createBridgeError({ code: 'RT_TASK_FAILED', message: 'test' })
    expect(err.cause).toBeUndefined()
  })
})

describe('isBridgeError', () => {
  it('returns true for valid BridgeError', () => {
    expect(isBridgeError(createBridgeError({ code: 'RT_TASK_FAILED', message: 'test' }))).toBe(true)
  })

  it('returns false for null', () => {
    expect(isBridgeError(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isBridgeError(undefined)).toBe(false)
  })

  it('returns false for string', () => {
    expect(isBridgeError('error')).toBe(false)
  })

  it('returns false for Error object', () => {
    expect(isBridgeError(new Error('test'))).toBe(false)
  })

  it('returns false for object without __brand', () => {
    expect(isBridgeError({ code: 'RT_TASK_FAILED', message: 'test' })).toBe(false)
  })

  it('returns false for object with wrong __brand', () => {
    expect(isBridgeError({ __brand: 'Wrong', code: 'RT_TASK_FAILED', message: 'test' })).toBe(false)
  })

  it('returns false for object without code', () => {
    expect(isBridgeError({ __brand: 'BridgeError', message: 'test' })).toBe(false)
  })

  it('returns false for object without message', () => {
    expect(isBridgeError({ __brand: 'BridgeError', code: 'RT_TASK_FAILED' })).toBe(false)
  })
})

describe('bridgeErrorToApiError', () => {
  const testCases: Array<{
    input: BridgeErrorCode
    expectedApiCode: ApiErrorCode
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
    it(`maps ${input} → ${expectedApiCode} (${description})`, () => {
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

  it('preserves cause chain', () => {
    const original = new Error('original')
    const bridgeError = createBridgeError({ code: 'RT_TASK_FAILED', message: 'wrapped', cause: original })
    const apiError = bridgeErrorToApiError(bridgeError)
    expect(apiError.cause).toBe(original)
  })

  it('handles undefined cause', () => {
    const bridgeError = createBridgeError({ code: 'RT_NO_OUTPUT', message: 'no output' })
    const apiError = bridgeErrorToApiError(bridgeError)
    expect(apiError.message).toBe('no output')
    expect(apiError.cause).toBeUndefined()
  })
})

describe('BRIDGE_TO_API_MAP snapshot', () => {
  it('matches snapshot', () => {
    const results = ALL_BRIDGE_ERROR_CODES.map(code => {
      const err = createBridgeError({ code, message: 'snapshot' })
      return { code, apiCode: bridgeErrorToApiError(err).code }
    })
    expect(results).toMatchSnapshot()
  })
})

describe('canTransition', () => {
  const legalTransitions: [ExecutionState, ExecutionState][] = [
    ['idle', 'preparing'],
    ['preparing', 'running'],
    ['running', 'completed'],
    ['running', 'failed'],
  ]

  const illegalTransitions: [ExecutionState, ExecutionState][] = [
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
    it(`allows ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(true)
    })
  })

  illegalTransitions.forEach(([from, to]) => {
    it(`rejects ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(false)
    })
  })
})

describe('CANCELLED error code', () => {
  it('is included in ApiErrorCode', () => {
    const err = createApiError('CANCELLED', '操作已取消')
    expect(err.code).toBe('CANCELLED')
  })

  it('RT_CANCELLED maps to CANCELLED (not SERVER_ERROR)', () => {
    const bridgeErr = createBridgeError({ code: 'RT_CANCELLED', message: '操作已取消' })
    const apiErr = bridgeErrorToApiError(bridgeErr)
    expect(apiErr.code).toBe('CANCELLED')
  })

  it('CANCELLED is not retryable', () => {
    const err = createApiError('CANCELLED', '操作已取消')
    expect(isRetryable(err)).toBe(false)
  })
})
