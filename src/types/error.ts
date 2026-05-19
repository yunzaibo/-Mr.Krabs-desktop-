/** API 错误码 */
export type ApiErrorCode =
  | 'NETWORK_ERROR'       // 网络不可达
  | 'TIMEOUT'             // 请求超时
  | 'UNAUTHORIZED'        // 未授权 (401)
  | 'FORBIDDEN'           // 禁止访问 (403)
  | 'NOT_FOUND'           // 资源不存在 (404)
  | 'VALIDATION_ERROR'    // 请求参数校验失败 (422)
  | 'RATE_LIMITED'        // 请求被限流 (429)
  | 'SERVER_ERROR'        // 服务端错误 (500+)
  | 'SSE_PARSE_ERROR'     // SSE 流解析失败
  | 'CANCELLED'           // 用户取消操作
  | 'UNKNOWN'             // 未知错误

/** 结构化 API 错误 */
export interface ApiError {
  /** 错误码 */
  code: ApiErrorCode
  /** 用户可读的错误信息 */
  message: string
  /** HTTP 状态码 (如有) */
  status?: number
  /** 原始错误 */
  cause?: unknown
}

// ─── Bridge 层错误 ──────────────────────────────────────

/** Bridge 层错误码（Runtime→Chat 桥接） */
export type BridgeErrorCode =
  | 'RT_TASK_FAILED'        // executeTask() catch block
  | 'RT_NO_OUTPUT'          // getExecutionResult() returns null
  | 'RT_ILLEGAL_TRANSITION' // canTransition() validation failure
  | 'RT_TIMEOUT'            // Execution timeout (future extension)
  | 'RT_CANCELLED'          // User-cancelled execution
  | 'BRIDGE_INTERNAL'       // Bridge layer internal error

/** Bridge 层结构化错误（branded type） */
export interface BridgeError {
  readonly __brand: 'BridgeError'
  code: BridgeErrorCode
  message: string
  cause?: unknown
}
