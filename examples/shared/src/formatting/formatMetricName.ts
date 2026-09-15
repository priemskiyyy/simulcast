import type { MetricName } from "../schemas/metricSchema";

export const formatMetricName = (name: MetricName) => {
  const LABELS: Record<MetricName, string> = {
    latency: "Latency",
    throughput: "Throughput",
    errors: "Error rate",
  };

  return LABELS[name];
};
