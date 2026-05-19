<!--
  DashboardStatsChart — Analytics section with line chart, success gauge, and metric cards.
  Displays 7-day task completion trends, success rate, and key metrics.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import SuccessRateGauge from './SuccessRateGauge.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export interface DashboardMetrics {
  tasksPerDay: { date: string; completed: number; failed: number }[]
  avgCompletionTime: number
  failureRate: number
  totalTasks: number
}

const props = defineProps<{ metrics: DashboardMetrics }>()

const { t } = useI18n()
const collapsed = ref(false)

const chartData = computed(() => ({
  labels: props.metrics.tasksPerDay.map((d) => d.date),
  datasets: [
    {
      label: 'Completed',
      data: props.metrics.tasksPerDay.map((d) => d.completed),
      borderColor: 'var(--hc-success, #22c55e)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.3,
    },
    {
      label: 'Failed',
      data: props.metrics.tasksPerDay.map((d) => d.failed),
      borderColor: 'var(--hc-error, #ef4444)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.3,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: 'var(--hc-text-muted)', font: { size: 11 } },
    },
  },
  scales: {
    x: {
      ticks: { color: 'var(--hc-text-muted)', font: { size: 10 } },
      grid: { color: 'var(--hc-border)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'var(--hc-text-muted)', font: { size: 10 }, stepSize: 1 },
      grid: { color: 'var(--hc-border)' },
    },
  },
}

const successRate = computed(() => {
  if (props.metrics.totalTasks === 0) return 0
  return Math.round(100 - props.metrics.failureRate)
})

const formattedAvgTime = computed(() => {
  const secs = props.metrics.avgCompletionTime
  if (secs < 60) return `${Math.round(secs)}s`
  const mins = Math.floor(secs / 60)
  const remaining = Math.round(secs % 60)
  return `${mins}m ${remaining}s`
})

const failureRateClass = computed(() => {
  const rate = props.metrics.failureRate
  if (rate < 5) return 'dsc-metric--success'
  if (rate < 15) return 'dsc-metric--warning'
  return 'dsc-metric--error'
})

const isEmpty = computed(() => props.metrics.totalTasks === 0)
</script>

<template>
  <div class="dsc">
    <button class="dsc__header" @click="collapsed = !collapsed">
      <span class="dsc__title">{{ t('dashboard.analytics', 'Analytics') }}</span>
      <span class="dsc__chevron" :class="{ 'dsc__chevron--collapsed': collapsed }">&#9660;</span>
    </button>

    <div v-if="!collapsed" class="dsc__body">
      <!-- Empty state -->
      <div v-if="isEmpty" class="dsc__empty">
        {{ t('dashboard.noTasks7Days', 'No tasks in the last 7 days') }}
      </div>

      <template v-else>
        <!-- Chart + Gauge row -->
        <div class="dsc__top-row">
          <div class="dsc__chart-wrap">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <div class="dsc__gauge-wrap">
            <SuccessRateGauge :rate="successRate" :total="metrics.totalTasks" />
          </div>
        </div>

        <!-- Metric cards -->
        <div class="dsc__metrics">
          <div class="dsc-metric">
            <span class="dsc-metric__label">{{ t('dashboard.avgTime', 'Avg Time') }}</span>
            <span class="dsc-metric__value">{{ formattedAvgTime }}</span>
          </div>
          <div class="dsc-metric">
            <span class="dsc-metric__label">{{ t('dashboard.failureRate', 'Failure Rate') }}</span>
            <span class="dsc-metric__value" :class="failureRateClass">
              {{ metrics.failureRate }}%
            </span>
          </div>
          <div class="dsc-metric">
            <span class="dsc-metric__label">{{ t('dashboard.totalTasks', 'Total Tasks') }}</span>
            <span class="dsc-metric__value">{{ metrics.totalTasks }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dsc {
  background: var(--hc-bg-card);
  border: 1px solid var(--hc-border);
  border-radius: 14px;
  overflow: hidden;
}
.dsc__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
}
.dsc__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--hc-text-primary);
}
.dsc__chevron {
  font-size: 10px;
  color: var(--hc-text-muted);
  transition: transform 0.2s;
}
.dsc__chevron--collapsed {
  transform: rotate(-90deg);
}
.dsc__body {
  padding: 0 14px 14px;
}
.dsc__empty {
  text-align: center;
  padding: 32px 16px;
  font-size: 13px;
  color: var(--hc-text-muted);
}
.dsc__top-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}
.dsc__chart-wrap {
  flex: 1;
  min-height: 160px;
  position: relative;
}
.dsc__gauge-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}
.dsc__metrics {
  display: flex;
  gap: 8px;
}
.dsc-metric {
  flex: 1;
  background: var(--hc-bg-elevated);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dsc-metric__label {
  font-size: 11px;
  color: var(--hc-text-muted);
}
.dsc-metric__value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: var(--hc-text-primary);
}
.dsc-metric--success {
  color: var(--hc-success, #22c55e);
}
.dsc-metric--warning {
  color: var(--hc-warning, #f0b429);
}
.dsc-metric--error {
  color: var(--hc-error, #ef4444);
}
</style>
