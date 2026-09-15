import type { Component } from "solid-js";
import {
  Bug,
  Timer,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  Gauge,
  Minus,
} from "lucide-solid";
import type { MetricName, DashboardState, MetricReading } from "example-shared";
import { trendStyles } from "example-shared/styles/trendStyles";
import { metricCardStyles } from "example-shared/styles/metricCardStyles";
import {
  METRIC_NAMES,
  formatMetricName,
  formatMetricValue,
  getMetricTone,
  getMetricTrend,
} from "example-shared";
import { For, Show, createMemo } from "solid-js";
import { Dynamic } from "solid-js/web";
import { match } from "ts-pattern";
import { Panel } from "src/components/Panel/Panel";

type MetricsPanelProps = {
  metrics: DashboardState["metrics"];
};

export const MetricsPanel: Component<MetricsPanelProps> = (props) => (
  <Panel title="Metrics" icon={Gauge}>
    <div class="grid gap-3 sm:grid-cols-3">
      <For each={METRIC_NAMES}>
        {(name) => <MetricCard name={name} reading={props.metrics[name]} />}
      </For>
    </div>
  </Panel>
);

type MetricCardProps = {
  name: MetricName;
  reading: MetricReading | undefined;
};

const MetricCard: Component<MetricCardProps> = (props) => {
  const metricIcon = createMemo(() =>
    match(props.name)
      .with("latency", () => Timer)
      .with("throughput", () => TrendingUp)
      .with("errors", () => Bug)
      .exhaustive(),
  );
  return (
    <div class={metricCardStyles({ empty: props.reading === undefined })}>
      <p class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Dynamic component={metricIcon()} size={14} />
        {formatMetricName(props.name)}
      </p>
      <Show
        when={props.reading}
        fallback={<p class="mt-2 text-2xl font-semibold text-zinc-400">–</p>}
      >
        {(reading) => {
          const trend = () => getMetricTrend(reading());
          const trendIcon = () =>
            match(trend())
              .with("UP", () => ArrowUp)
              .with("DOWN", () => ArrowDown)
              .with("FLAT", () => Minus)
              .exhaustive();

          return (
            <p class="mt-2 flex items-end gap-2">
              <span class="text-xl font-semibold tabular-nums whitespace-nowrap">
                {formatMetricValue({
                  name: props.name,
                  value: reading().current,
                })}
              </span>
              <span
                class={trendStyles({
                  tone: getMetricTone(props.name, trend()),
                })}
              >
                <Dynamic component={trendIcon()} size={11} stroke-width={2.5} />
              </span>
            </p>
          );
        }}
      </Show>
    </div>
  );
};
