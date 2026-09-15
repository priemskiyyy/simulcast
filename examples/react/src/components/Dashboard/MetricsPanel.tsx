import type React from "react";
import { useMemo } from "react";
import {
  Bug,
  ChartLineUp,
  Timer,
  ArrowDown,
  ArrowUp,
  Gauge,
  Minus,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type {
  MetricName,
  DashboardState,
  MetricReading,
  Tone,
} from "example-shared";
import { trendStyles } from "example-shared/styles/trendStyles";
import { metricCardStyles } from "example-shared/styles/metricCardStyles";
import {
  METRIC_NAMES,
  formatMetricName,
  formatMetricValue,
  getMetricTone,
  getMetricTrend,
} from "example-shared";
import type { ReactNode } from "react";
import { match } from "ts-pattern";
import { Panel } from "src/components/Panel/Panel";

type MetricsPanelProps = {
  metrics: DashboardState["metrics"];
};

export const MetricsPanel: React.FunctionComponent<MetricsPanelProps> = ({
  metrics,
}) => (
  <Panel title="Metrics" icon={Gauge}>
    <div className="grid gap-3 sm:grid-cols-3">
      {METRIC_NAMES.map((name) => (
        <MetricCard key={name} name={name} reading={metrics[name]} />
      ))}
    </div>
  </Panel>
);

type MetricCardProps = {
  name: MetricName;
  reading: MetricReading | undefined;
};

const MetricCard: React.FunctionComponent<MetricCardProps> = ({
  name,
  reading,
}) => {
  const metricIcon = useMemo(
    () =>
      match(name)
        .with("latency", () => Timer)
        .with("throughput", () => ChartLineUp)
        .with("errors", () => Bug)
        .exhaustive(),
    [name],
  );
  if (reading === undefined) {
    return (
      <div className={metricCardStyles({ empty: true })}>
        <MetricLabel icon={metricIcon}>{formatMetricName(name)}</MetricLabel>
        <p className="mt-2 text-2xl font-semibold text-zinc-400">–</p>
      </div>
    );
  }

  const trend = getMetricTrend(reading);
  const trendIcon = match(trend)
    .with("UP", () => ArrowUp)
    .with("DOWN", () => ArrowDown)
    .with("FLAT", () => Minus)
    .exhaustive();

  return (
    <div className={metricCardStyles({ empty: false })}>
      <MetricLabel icon={metricIcon}>{formatMetricName(name)}</MetricLabel>
      <p className="mt-2 flex items-end gap-2">
        <span className="text-xl font-semibold tabular-nums whitespace-nowrap">
          {formatMetricValue({ name, value: reading.current })}
        </span>
        <TrendMark tone={getMetricTone(name, trend)} icon={trendIcon} />
      </p>
    </div>
  );
};

type MetricLabelProps = {
  icon: Icon;
  children: ReactNode;
};

const MetricLabel: React.FunctionComponent<MetricLabelProps> = ({
  icon: LabelIcon,
  children,
}) => (
  <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
    <LabelIcon size={14} />
    {children}
  </p>
);

type TrendMarkProps = {
  tone: Tone;
  icon: Icon;
};

const TrendMark: React.FunctionComponent<TrendMarkProps> = ({
  tone,
  icon: MarkIcon,
}) => (
  <span className={trendStyles({ tone: tone })}>
    <MarkIcon size={11} weight="bold" />
  </span>
);
