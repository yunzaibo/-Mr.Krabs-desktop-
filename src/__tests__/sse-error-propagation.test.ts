import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch for apiSSE tests
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock env
vi.mock('@/config/env', () => ({
  env: { apiBase: 'http://localhost:3000', wsBase: 'ws://localhost:3000', timeout: 10000 },
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { apiSSE } from '@/api/client'
import { fromHttpStatus } from '@/utils/errors'

describe('apiSSE error propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws ApiError (not plain Error) on HTTP failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    })

    await expect(apiSSE('/test')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请稍后重试',
    })
  })

  it('preserves error code through to consumer', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    try {
      await apiSSE('/test')
      expect.fail('should have thrown')
    } catch (e: any) {
      // fromNativeError should passthrough ApiError
      const { fromNativeError } = await import('@/utils/errors')
      const normalized = fromNativeError(e)
      expect(normalized.code).toBe('UNAUTHORIZED')
    }
  })
})
