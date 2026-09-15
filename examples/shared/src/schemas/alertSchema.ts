import { z } from "zod";

export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;

export const alertSchema = z.object({
  id: z.string(),
  severity: z.enum(ALERT_SEVERITIES),
  text: z.string().min(1),
  raisedAt: z.iso.datetime(),
});

export type Alert = z.infer<typeof alertSchema>;
export type AlertSeverity = Alert["severity"];
