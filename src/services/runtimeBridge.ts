/**
 * runtimeBridge — Chat ↔ Runtime anti-coupling shim.
 *
 * Chat 层不直接 import RuntimeStore。
 * 此 shim 是 Chat 与 Runtime Kernel 之间的唯一接触点。
 *
 * 不是：
 * - store
 * - orchestrator
 * - subsystem
 *
 * 只是：
 * - function wrapper（薄封装）
 */

import { useRuntimeStore } from '@/stores/runtime'
import { useTaskStore } from '@/stores/tasks'
import type { Task, TaskResult, TaskOutput, TaskError } from '@/types'
import { createApiError, createBridgeError } from '@/utils/errors'
import type { ApiError, BridgeError, BridgeErrorCode } from '@/types/error'

// Re-export for consumers
export type { BridgeError, BridgeErrorCode } from '@/types/error'
export { createBridgeError } from '@/utils/errors'

/** BridgeErrorCode → ApiErrorCode 映射表 */
const BRIDGE_TO_API_MAP: Record<BridgeErrorCode, ApiError['code']> = {
  'RT_TASK_FAILED': 'SERVER_ERROR',
  'RT_NO_OUTPUT': 'SERVER_ERROR',
  'RT_ILLEGAL_TRANSITION': 'SERVER_ERROR',
  'RT_TIMEOUT': 'TIMEOUT',
  'RT_CANCELLED': 'CANCELLED',
  'BRIDGE_INTERNAL': 'UNKNOWN',
}

/** BridgeError → ApiError 映射 */
export function bridgeErrorToApiError(err: BridgeError): ApiError {
  const apiCode = BRIDGE_TO_API_MAP[err.code]
  return createApiError(apiCode, err.message, undefined, err.cause)
}

/**
 * 为 chat task 注册 RuntimeContext。
 *
 * chat task 默认 Timeline 仅产生：
 * - task.completed
 * - task.failed
 * （registerContext 属于 infrastructure event，不是 human activity）
 */
export function registerChatTask(task: Task): void {
  const runtime = useRuntimeStore()
  runtime.registerContextForTask(task)
}

/** chat task 完成 — 写入 output + 产生 task.completed timeline 事件 */
export function completeChatTask(taskId: string, output: TaskOutput): void {
  const runtime = useRuntimeStore()
  runtime.completeContextForTask(taskId, output)
}

/** chat task 失败 — 写入 error + 产生 task.failed timeline 事件 */
export function failChatTask(taskId: string, error: TaskError): void {
  const runtime = useRuntimeStore()
  runtime.failContextForTask(taskId, error)
}

/**
 * executeChatTask — Chat 调用的 Runtime 执行入口。
 *
 * 封装完整执行生命周期：
 * - RuntimeStore.executeTask() (lifecycle, returns void)
 * - TaskStore.completeTask() (Runtime-owned completion)
 * - error → TaskStore.failTask() → rethrow
 *
 * @returns TaskResult — Chat 只消费这个值
 * @throws 执行失败时抛出，Chat 自行处理错误展示
 */
export async function executeChatTask(taskId: string): Promise<TaskResult> {
  const runtime = useRuntimeStore()
  const taskStore = useTaskStore()

  try {
    // Runtime execution (lifecycle operation, returns void)
    await runtime.executeTask(taskId)

    // Bridge responsibility: extract result
    const result = runtime.getExecutionResult(taskId)
    if (!result) {
      const bridgeErr = createBridgeError({ code: 'RT_NO_OUTPUT', message: '执行完成但无输出结果' })
      taskStore.failTask(taskId, { code: bridgeErr.code, message: bridgeErr.message })
      throw bridgeErrorToApiError(bridgeErr)
    }

    // Runtime-owned completion: bridge 代理 TaskStore
    taskStore.completeTask(taskId, {
      result,
      artifacts: [],
    })

    return result
  } catch (e) {
    // If already converted to ApiError (e.g., RT_NO_OUTPUT branch), rethrow directly
    if (e && typeof e === 'object' && 'code' in e && 'message' in e && !('__brand' in e)) {
      throw e
    }
    // Runtime 路径下，Runtime 已写入 execution.failed timeline
    // Bridge 代理 TaskStore fail（不重复 failChatTask，timeline 已写入）
    const msg = e instanceof Error ? e.message : String(e)
    const bridgeErr = createBridgeError({ code: 'RT_TASK_FAILED', message: msg })
    taskStore.failTask(taskId, { code: bridgeErr.code, message: bridgeErr.message })
    throw bridgeErrorToApiError(bridgeErr)
  }
}
