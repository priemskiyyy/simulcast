<script setup lang="ts">
import { PhGauge } from "@phosphor-icons/vue";
import { METRIC_NAMES } from "example-shared";
import type { DashboardState } from "example-shared";
import MetricCard from "src/components/MetricCard.vue";
import Panel from "src/components/Panel.vue";

type MetricsPanelProps = { metrics: DashboardState["metrics"] };

defineProps<MetricsPanelProps>();
</script>

<template>
  <Panel title="Metrics" :icon="PhGauge">
    <div class="grid gap-3 sm:grid-cols-3">
      <MetricCard
        v-for="name in METRIC_NAMES"
        :key="name"
        :name="name"
        :reading="metrics[name]"
      />
    </div>
  </Panel>
</template>
