import { match } from "ts-pattern";
import type { Metric } from "../schemas/metricSchema";

export const formatMetricValue = ({ name, value }: Metric) =>
  match(name)
    .with("latency", () => `${Math.round(value)} ms`)
    .with("throughput", () => `${Math.round(value)} rps`)
    .with("errors", () => `${value.toFixed(2)} %`)
    .exhaustive();
