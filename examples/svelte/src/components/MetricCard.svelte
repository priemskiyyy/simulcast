<script lang="ts">
  import type { MetricName, MetricReading } from "example-shared";
  import {
    Bug,
    ChartLineUp,
    Timer,
    ArrowDown,
    ArrowUp,
    Minus,
  } from "phosphor-svelte";
  import { trendStyles } from "example-shared/styles/trendStyles";
  import { metricCardStyles } from "example-shared/styles/metricCardStyles";
  import {
    formatMetricName,
    formatMetricValue,
    getMetricTone,
    getMetricTrend,
  } from "example-shared";
  import { match } from "ts-pattern";

  type MetricCardProps = {
    name: MetricName;
    reading: MetricReading | undefined;
  };

  let { name, reading }: MetricCardProps = $props();

  const MetricIcon = $derived(
    match(name)
      .with("latency", () => Timer)
      .with("throughput", () => ChartLineUp)
      .with("errors", () => Bug)
      .exhaustive(),
  );
  const trend = $derived(
    reading === undefined ? null : getMetricTrend(reading),
  );
  const TrendIcon = $derived(
    match(trend)
      .with("UP", () => ArrowUp)
      .with("DOWN", () => ArrowDown)
      .with("FLAT", () => Minus)
      .with(null, () => null)
      .exhaustive(),
  );
</script>

<div class={metricCardStyles({ empty: reading === undefined })}>
  <p
    class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
  >
    <MetricIcon size={14} />
    {formatMetricName(name)}
  </p>
  {#if reading === undefined || trend === null || TrendIcon === null}
    <p class="mt-2 text-2xl font-semibold text-zinc-400">–</p>
  {:else}
    <p class="mt-2 flex items-end gap-2">
      <span class="text-xl font-semibold tabular-nums whitespace-nowrap">
        {formatMetricValue({ name, value: reading.current })}
      </span>
      <span class={trendStyles({ tone: getMetricTone(name, trend) })}>
        <TrendIcon size={11} weight="bold" />
      </span>
    </p>
  {/if}
</div>
