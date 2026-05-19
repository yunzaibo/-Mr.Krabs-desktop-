/**
 * useDashboardRuntime — Dashboard 专用 Runtime 数据桥接。
 *
 * 职责：
 * - 从 RuntimeStore + TaskStore 读取原始数据
 * - 投影为 Dashboard 友好的轻量摘要
 * - 不引入新 store，不调用 mutation 方法
 *
 * 与 useWorkspace 的区别：
 * - useWorkspace 面向完整三面板 Runtime 视图
 * - useDashboardRuntime 面向 Dashboard 统计卡片 + 活动列表
 */

import { computed } from 'vue'
import { useRuntimeStore } from '@/stores/runtime'
import { useTaskStore } from '@/stores/tasks'
import type { RuntimeEvent } from '@/types/timeline'
import type { RecoverySummary } from '@/types/recovery'

export interface DashboardRuntimeSummary {
  activeTaskCount: number
  completedTodayCount: number
  failedTodayCount: number
  recentEvents: RuntimeEvent[]
}

export interface DashboardActivityItem {
  id: string
  title: string
  type: 'task' | 'runtime'
  status: string
  time: string
}

export interface DashboardHealthStatus {
  overall: 'healthy' | 'degraded' | 'error'
  activeTasks: number
  failedToday: number
  recoveries: RecoverySummary[]
}

export interface DashboardMetrics {
  tasksPerDay: { date: string; completed: number; failed: number }[]
  avgCompletionTime: number
  failureRate: number
  totalTasks: number
}

export function useDashboardRuntime() {
  const runtimeStore = useRuntimeStore()
  const taskStore = useTaskStore()

  /** 活跃任务数 */
  const activeTaskCount = computed(() => taskStore.activeCount)

  /** 今日完成的任务数 */
  const completedTodayCount = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTs = today.getTime()
    return taskStore.completedTasks.filter((t) => {
      const completedAt = t.metadata?.completedAt
      if (!completedAt) return false
      return new Date(completedAt).getTime() >= todayTs
    }).length
  })

  /** 今日失败的任务数 */
  const failedTodayCount = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTs = today.getTime()
    return taskStore.completedTasks.filter((t) => {
      if (t.status !== 'failed') return false
      const completedAt = t.metadata?.completedAt
      if (!completedAt) return false
      return new Date(completedAt).getTime() >= todayTs
    }).length
  })

  /** 最近 Runtime 事件（最新 10 条） */
  const recentEvents = computed(() => runtimeStore.getRecentEvents(10))

  /** Context 摘要列表 */
  const contextSummaries = computed(() => runtimeStore.contextSummaries)

  /** 活跃任务的 Recovery 摘要 */
  const recoverySummaries = computed(() => {
    return taskStore.activeTasks
      .map((t) => runtimeStore.getRecoverySummary(t.id))
      .filter((r): r is RecoverySummary => r !== null)
  })

  /** 系统健康状态 */
  const healthStatus = computed<DashboardHealthStatus>(() => {
    const failed = failedTodayCount.value
    const recoveries = recoverySummaries.value
    const hasFailedRecovery = recoveries.some((r) => r.resolution === 'failed')

    let overall: DashboardHealthStatus['overall'] = 'healthy'
    if (hasFailedRecovery || failed > 2) {
      overall = 'error'
    } else if (failed > 0 || recoveries.length > 0) {
      overall = 'degraded'
    }

    return {
      overall,
      activeTasks: activeTaskCount.value,
      failedToday: failed,
      recoveries,
    }
  })

  /** Dashboard 统计指标 */
  const dashboardMetrics = computed<DashboardMetrics>(() => {
    const completed = taskStore.completedTasks || []
    const failed = taskStore.failedTasks || []
    const total = completed.length + failed.length

    const now = new Date()
    const tasksPerDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]
      return {
        date: dateStr,
        completed: completed.filter((t) => t.completedAt?.startsWith(dateStr)).length,
        failed: failed.filter((t) => t.failedAt?.startsWith(dateStr)).length,
      }
    })

    const durations = completed.filter((t) => t.duration).map((t) => t.duration)
    const avgCompletionTime = durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : 0

    const failureRate = total > 0 ? (failed.length / total) * 100 : 0

    return { tasksPerDay, avgCompletionTime, failureRate, totalTasks: total }
  })

  /** 从 TaskStore + RuntimeStore 合成活动列表 */
  const activityItems = computed<DashboardActivityItem[]>(() => {
    const items: DashboardActivityItem[] = []

    // 最近完成的任务
    const recentCompleted = taskStore.completedTasks
      .slice(-10)
      .reverse()
      .map((t) => ({
        id: t.id,
        title: t.type || t.id,
        type: 'task' as const,
        status: t.status,
        time: t.metadata?.completedAt || t.metadata?.startedAt || '',
      }))
    items.push(...recentCompleted)

    // 最近 Runtime 事件
    const recentEvts = recentEvents.value.slice(0, 5).map((e) => ({
      id: e.taskId + e.type + (e.timestamp ?? ''),
      title: e.type,
      type: 'runtime' as const,
      status: e.type,
      time: e.timestamp ?? '',
    }))
    items.push(...recentEvts)

    // 按时间排序，取最新 10 条
    return items
      .filter((a) => a.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
  })

  return {
    activeTaskCount,
    completedTodayCount,
    failedTodayCount,
    recentEvents,
    contextSummaries,
    recoverySummaries,
    healthStatus,
    activityItems,
    dashboardMetrics,
  }
}
