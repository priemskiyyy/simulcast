import { z } from "zod";

export const METRIC_NAMES = ["latency", "throughput", "errors"] as const;

export const metricSchema = z.object({
  name: z.enum(METRIC_NAMES),
  value: z.number().nonnegative(),
});

export type Metric = z.infer<typeof metricSchema>;
export type MetricName = Metric["name"];
