import type { AlertSeverity } from "../schemas/alertSchema";

export const formatSeverity = (severity: AlertSeverity) => {
  const LABELS: Record<AlertSeverity, string> = {
    INFO: "Info",
    WARNING: "Warning",
    CRITICAL: "Critical",
  };

  return LABELS[severity];
};
