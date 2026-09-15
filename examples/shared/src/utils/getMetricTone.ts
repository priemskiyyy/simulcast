import { P, match } from "ts-pattern";
import type { MetricName } from "../schemas/metricSchema";
import type { MetricTrend } from "./getMetricTrend";
import type { Tone } from "./Tone";

/** Rising throughput is good news; rising latency or errors is not. */
export const getMetricTone = (name: MetricName, trend: MetricTrend): Tone =>
  match([name, trend] as const)
    .with([P._, "FLAT"], (): Tone => "neutral")
    .with(["throughput", "UP"], (): Tone => "positive")
    .with(["throughput", "DOWN"], (): Tone => "warning")
    .with(["latency", "UP"], ["errors", "UP"], (): Tone => "danger")
    .with(["latency", "DOWN"], ["errors", "DOWN"], (): Tone => "positive")
    .exhaustive();
