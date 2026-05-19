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
