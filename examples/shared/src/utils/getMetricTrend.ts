import type { MetricReading } from "../state/dashboardReducer";

export type MetricTrend = "UP" | "DOWN" | "FLAT";

export const getMetricTrend = ({
  current,
  previous,
}: MetricReading): MetricTrend => {
  if (previous === null) {
    return "FLAT";
  }

  if (current > previous) {
    return "UP";
  }

  if (current < previous) {
    return "DOWN";
  }

  return "FLAT";
};
