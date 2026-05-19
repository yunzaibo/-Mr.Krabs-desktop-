<!--
  SuccessRateGauge — Simple circular gauge showing success rate percentage.
  Placeholder for future Chart.js Doughnut-based implementation.
-->
<script setup lang="ts">
defineProps<{ rate: number; total: number }>()
</script>

<template>
  <div class="hc-gauge">
    <span class="hc-gauge__value">{{ rate }}%</span>
    <span class="hc-gauge__label">Success</span>
  </div>
</template>

<style scoped>
.hc-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.hc-gauge__value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: var(--hc-success, #22c55e);
}
.hc-gauge__label {
  font-size: 11px;
  color: var(--hc-text-muted);
}
</style>
