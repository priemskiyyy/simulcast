import { match } from "ts-pattern";
import type { Publication } from "../realtime/Envelope";
import { ALERT_SEVERITIES } from "../schemas/alertSchema";
import type { Alert } from "../schemas/alertSchema";
import { DEPLOY_STAGES } from "../schemas/deploySchema";
import type { Deploy } from "../schemas/deploySchema";
import { METRIC_NAMES } from "../schemas/metricSchema";

const AUTHORS = ["Ada", "Grace", "Linus", "Margaret", "Radia"];
const TEXTS = [
  "Deploy window opens in ten minutes.",
  "Latency looks healthy after the cache change.",
  "Who owns the billing worker alerts?",
  "Rolling back the search index, one moment.",
  "All green on the status page.",
];
const SERVICES = ["api", "billing", "search", "notifications"];
const ALERT_TEXTS = [
  "Queue depth above threshold",
  "Disk usage at 85%",
  "Error budget burning fast",
  "Certificate expires in 3 days",
];
const TICK_INTERVAL = 1_500;
const STEPS = [
  "MESSAGE",
  "MESSAGE",
  "METRIC",
  "METRIC",
  "ALERT",
  "DEPLOY",
] as const;

export type SimulationOptions = {
  publish: (publication: Publication) => void;
  /** The room messages and presence are published to. Change it with `setRoom`. */
  roomId: string;
  random?: () => number;
  now?: () => number;
};

/** Publishes plausible Mission Control traffic, by hand or on an interval. */
export const createSimulation = ({
  publish,
  roomId,
  random = Math.random,
  now = Date.now,
}: SimulationOptions) => {
  let currentRoomId = roomId;
  const openAlerts: Alert[] = [];
  const deploys = new Map<string, Deploy>();
  let online = 3;
  let sequence = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const pick = <TItem>(items: readonly TItem[]): TItem => {
    const item = items[Math.floor(random() * items.length)];

    if (item === undefined) {
      throw new Error("Cannot pick from an empty list.");
    }

    return item;
  };
  const nextId = () => {
    sequence += 1;
    return `${now().toString(36)}-${sequence}`;
  };
  const room = () => `rooms:${currentRoomId}` as const;

  const sendMessage = () => {
    publish({
      channel: room(),
      envelope: {
        name: "message.created",
        body: {
          id: nextId(),
          author: pick(AUTHORS),
          text: pick(TEXTS),
          sentAt: new Date(now()).toISOString(),
        },
      },
    });
  };
  const changePresence = () => {
    online = Math.max(1, online + (random() < 0.5 ? -1 : 1));
    publish({
      channel: room(),
      envelope: { name: "presence.changed", body: { online } },
    });
  };
  const reportMetrics = () => {
    for (const name of METRIC_NAMES) {
      const value = match(name)
        .with("latency", () => 40 + random() * 120)
        .with("throughput", () => 800 + random() * 600)
        .with("errors", () => random() * 2)
        .exhaustive();

      publish({
        channel: "metrics",
        envelope: { name: "metric.reported", body: { name, value } },
      });
    }
  };
  const raiseAlert = () => {
    const alert: Alert = {
      id: nextId(),
      severity: pick(ALERT_SEVERITIES),
      text: pick(ALERT_TEXTS),
      raisedAt: new Date(now()).toISOString(),
    };
    openAlerts.push(alert);
    publish({
      channel: "alerts",
      envelope: { name: "alert.raised", body: alert },
    });
  };
  const resolveAlert = () => {
    const alert = openAlerts.shift();

    if (alert === undefined) {
      return;
    }

    publish({
      channel: "alerts",
      envelope: { name: "alert.resolved", body: { id: alert.id } },
    });
  };
  const advanceDeploy = () => {
    const service = pick(SERVICES);
    const current = deploys.get(service) ?? {
      service,
      stage: DEPLOY_STAGES[0],
      percent: 0,
    };
    const percent = Math.min(
      100,
      current.percent + 20 + Math.floor(random() * 30),
    );
    const nextStageIndex = Math.min(
      DEPLOY_STAGES.length - 1,
      DEPLOY_STAGES.indexOf(current.stage) + (percent === 100 ? 1 : 0),
    );
    const stage = DEPLOY_STAGES[nextStageIndex] ?? current.stage;
    const deploy: Deploy = {
      service,
      stage,
      percent: stage === current.stage ? percent : 0,
    };
    deploys.set(service, deploy);
    publish({
      channel: "deploys",
      envelope: { name: "deploy.progressed", body: deploy },
    });
  };

  const tick = () => {
    match(pick(STEPS))
      .with("MESSAGE", () => {
        sendMessage();
        changePresence();
      })
      .with("METRIC", reportMetrics)
      .with("ALERT", () => {
        if (openAlerts.length > 2) {
          resolveAlert();
          return;
        }

        raiseAlert();
      })
      .with("DEPLOY", advanceDeploy)
      .exhaustive();
  };

  const start = () => {
    if (timer !== null) {
      return;
    }

    tick();
    timer = setInterval(tick, TICK_INTERVAL);
  };
  const stop = () => {
    if (timer === null) {
      return;
    }

    clearInterval(timer);
    timer = null;
  };

  const setRoom = (nextRoomId: string) => {
    currentRoomId = nextRoomId;
  };

  return {
    start,
    stop,
    setRoom,
    isRunning: () => timer !== null,
    sendMessage,
    reportMetrics,
    raiseAlert,
    resolveAlert,
    advanceDeploy,
  };
};

export type Simulation = ReturnType<typeof createSimulation>;
