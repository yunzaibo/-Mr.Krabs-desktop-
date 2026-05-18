import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  wsClearCallbacks,
  socketInstances,
} = vi.hoisted(() => ({
  wsClearCallbacks: vi.fn(),
  socketInstances: [] as Array<{
    url: string
    readyState: number
    send: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    onopen: ((event?: unknown) => void) | null
    onmessage: ((event: { data: string }) => void) | null
    onerror: ((event?: unknown) => void) | null
    onclose: ((event?: unknown) => void) | null
  }>,
}))

vi.mock('@/api/websocket', () => ({
  hexclawWS: {
    clearStreamCallbacks: wsClearCallbacks,
  },
}))

import { resumeWebSocketStream, clearWebSocketCallbacks } from '../chatService'
import { DESKTOP_USER_ID } from '@/constants'

class MockRequestWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 3

  url: string
  readyState = MockRequestWebSocket.CONNECTING
  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = MockRequestWebSocket.CLOSED
  })
  onopen: ((event?: unknown) => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event?: unknown) => void) | null = null
  onclose: ((event?: unknown) => void) | null = null

  constructor(url: string) {
    this.url = url
    socketInstances.push(this)
  }
}

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    socketInstances.length = 0
    vi.stubGlobal('WebSocket', MockRequestWebSocket as unknown as typeof WebSocket)
  })

  // ─── resumeWebSocketStream ───

  it('sends a resume payload and resolves from stream_snapshot', async () => {
    const handle = resumeWebSocketStream('s1', 'req-resume', {
      onSnapshot: vi.fn(),
    })
    const socket = socketInstances[0]

    socket!.readyState = MockRequestWebSocket.OPEN
    socket!.onopen?.()

    expect(socket!.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'resume',
      session_id: 's1',
      request_id: 'req-resume',
      user_id: DESKTOP_USER_ID,
    }))

    socket!.onmessage?.({
      data: JSON.stringify({
        type: 'stream_snapshot',
        content: 'resumed content',
        session_id: 's1',
        request_id: 'req-resume',
        done: true,
        metadata: { request_id: 'req-resume' },
      }),
    })

    await expect(handle.done).resolves.toEqual({
      content: 'resumed content',
      metadata: { request_id: 'req-resume' },
      toolCalls: undefined,
      agentName: undefined,
    })
  })

  it('cancel sends cancel on the socket and resolves null', async () => {
    const handle = resumeWebSocketStream('s1', 'req-2')
    const socket = socketInstances[0]

    socket!.readyState = MockRequestWebSocket.OPEN
    socket!.onopen?.()
    handle.cancel()

    expect(socket!.send).toHaveBeenLastCalledWith(JSON.stringify({
      type: 'cancel',
      session_id: 's1',
      request_id: 'req-2',
    }))
    await expect(handle.done).resolves.toBeNull()
  })

  // ─── clearWebSocketCallbacks ───

  it('delegates to hexclawWS.clearStreamCallbacks', () => {
    clearWebSocketCallbacks()
    expect(wsClearCallbacks).toHaveBeenCalled()
  })
})
