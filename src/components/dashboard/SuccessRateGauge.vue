<!--
  SuccessRateGauge — Circular SVG gauge showing success rate percentage.
  Color-coded: >= 95% green, 85-94% yellow, < 85% red.
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ rate: number; total: number }>()

const CIRCUMFERENCE = 2 * Math.PI * 40 // r=40

const percentage = computed(() => Math.round(props.rate))
const dashOffset = computed(() => CIRCUMFERENCE - (props.rate / 100) * CIRCUMFERENCE)

const gaugeClass = computed(() => {
  if (props.rate >= 95) return 'hc-gauge--success'
  if (props.rate >= 85) return 'hc-gauge--warning'
  return 'hc-gauge--error'
})
</script>

<template>
  <div class="hc-gauge" :class="gaugeClass">
    <svg class="hc-gauge__svg" viewBox="0 0 100 100">
      <circle class="hc-gauge__track" cx="50" cy="50" r="40" />
      <circle
        class="hc-gauge__fill"
        cx="50"
        cy="50"
        r="40"
        :style="{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset }"
      />
    </svg>
    <div class="hc-gauge__overlay">
      <span class="hc-gauge__value">{{ percentage }}%</span>
      <span class="hc-gauge__label">{{ total }} tasks</span>
    </div>
  </div>
</template>

<style scoped>
.hc-gauge {
  position: relative;
  width: 120px;
  height: 120px;
}

.hc-gauge__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.hc-gauge__track {
  fill: none;
  stroke: var(--hc-border, #333);
  stroke-width: 8;
}

.hc-gauge__fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease, stroke 0.3s ease;
}

/* Color classes */
.hc-gauge--success .hc-gauge__fill {
  stroke: var(--hc-success, #22c55e);
}
.hc-gauge--warning .hc-gauge__fill {
  stroke: var(--hc-warning, #eab308);
}
.hc-gauge--error .hc-gauge__fill {
  stroke: var(--hc-error, #ef4444);
}

.hc-gauge__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.hc-gauge__value {
  font-size: 22px;
  font-weight: 700;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: var(--hc-text, #e5e5e5);
}

.hc-gauge__label {
  font-size: 11px;
  color: var(--hc-text-muted, #888);
}
</style>
