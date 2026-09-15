import type { Alert } from "../schemas/alertSchema";
import type { AlertResolution } from "../schemas/alertResolutionSchema";
import type { Deploy } from "../schemas/deploySchema";
import type { Message } from "../schemas/messageSchema";
import type { Metric } from "../schemas/metricSchema";
import type { Presence } from "../schemas/presenceSchema";

/** Every event Mission Control receives, keyed by the provider event name. */
export type Events = {
  "message.created": { channel: `rooms:${string}`; payload: Message };
  "presence.changed": { channel: `rooms:${string}`; payload: Presence };
  "metric.reported": { channel: "metrics"; payload: Metric };
  "alert.raised": { channel: "alerts"; payload: Alert };
  "alert.resolved": { channel: "alerts"; payload: AlertResolution };
  "deploy.progressed": { channel: "deploys"; payload: Deploy };
};

export type EventName = keyof Events;
