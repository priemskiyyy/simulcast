import { match } from "ts-pattern";
import type { AlertSeverity } from "../schemas/alertSchema";
import type { Tone } from "./Tone";

export const getSeverityTone = (severity: AlertSeverity): Tone =>
  match(severity)
    .with("INFO", (): Tone => "neutral")
    .with("WARNING", (): Tone => "warning")
    .with("CRITICAL", (): Tone => "danger")
    .exhaustive();
