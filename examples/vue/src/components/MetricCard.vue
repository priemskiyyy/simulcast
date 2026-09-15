<script setup lang="ts">
import {
  PhBug,
  PhChartLineUp,
  PhTimer,
  PhArrowDown,
  PhArrowUp,
  PhMinus,
} from "@phosphor-icons/vue";
import type { MetricName, MetricReading } from "example-shared";
import { trendStyles } from "example-shared/styles/trendStyles";
import { metricCardStyles } from "example-shared/styles/metricCardStyles";
import {
  formatMetricName,
  formatMetricValue,
  getMetricTone,
  getMetricTrend,
} from "example-shared";
import { match } from "ts-pattern";
import { computed } from "vue";

type MetricCardProps = {
  name: MetricName;
  reading: MetricReading | undefined;
};

const props = defineProps<MetricCardProps>();

const metricIcon = computed(() =>
  match(props.name)
    .with("latency", () => PhTimer)
    .with("throughput", () => PhChartLineUp)
    .with("errors", () => PhBug)
    .exhaustive(),
);
const trend = computed(() =>
  props.reading === undefined ? null : getMetricTrend(props.reading),
);
const trendIcon = computed(() =>
  match(trend.value)
    .with("UP", () => PhArrowUp)
    .with("DOWN", () => PhArrowDown)
    .with("FLAT", () => PhMinus)
    .with(null, () => null)
    .exhaustive(),
);
</script>

<template>
  <div :class="metricCardStyles({ empty: reading === undefined })">
    <p
      class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
    >
      <component :is="metricIcon" :size="14" />
      {{ formatMetricName(name) }}
    </p>
    <p
      v-if="reading === undefined || trend === null"
      class="mt-2 text-2xl font-semibold text-zinc-400"
    >
      –
    </p>
    <p v-else class="mt-2 flex items-end gap-2">
      <span class="text-xl font-semibold tabular-nums whitespace-nowrap">
        {{ formatMetricValue({ name, value: reading.current }) }}
      </span>
      <span :class="trendStyles({ tone: getMetricTone(name, trend) })">
        <component :is="trendIcon" :size="11" weight="bold" />
      </span>
    </p>
  </div>
</template>
