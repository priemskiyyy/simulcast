import type { Component } from "solid-js";
import {
  alertResolutionSchema,
  alertSchema,
  dashboardReducer,
  deploySchema,
  initialDashboardState,
  messageSchema,
  metricSchema,
  presenceSchema,
} from "example-shared";
import type { DashboardAction } from "example-shared";
import { createSignal } from "solid-js";
import { AlertsPanel } from "src/components/Dashboard/AlertsPanel";
import { DeploysPanel } from "src/components/Dashboard/DeploysPanel";
import { MessagesPanel } from "src/components/Dashboard/MessagesPanel";
import { MetricsPanel } from "src/components/Dashboard/MetricsPanel";
import { useAlertRaised } from "src/hooks/generated/useAlertRaised";
import { useAlertResolved } from "src/hooks/generated/useAlertResolved";
import { useDeployProgressed } from "src/hooks/generated/useDeployProgressed";
import { useMessageCreated } from "src/hooks/generated/useMessageCreated";
import { useMetricReported } from "src/hooks/generated/useMetricReported";
import { usePresenceChanged } from "src/hooks/generated/usePresenceChanged";

type DashboardProps = {
  roomId: string;
};

/** Six generated primitives share four subscriptions; every payload is parsed before the reducer sees it. */
export const Dashboard: Component<DashboardProps> = (props) => {
  const [state, setState] = createSignal(initialDashboardState);
  const dispatch = (action: DashboardAction) => {
    setState((current) => dashboardReducer(current, action));
  };
  const room = () => `rooms:${props.roomId}` as const;

  useMessageCreated(
    room,
    (message) => dispatch({ type: "MESSAGE_RECEIVED", message }),
    {
      parse: messageSchema.parse,
    },
  );
  usePresenceChanged(
    room,
    (presence) => dispatch({ type: "PRESENCE_CHANGED", presence }),
    {
      parse: presenceSchema.parse,
    },
  );
  useMetricReported(
    "metrics",
    (metric) => dispatch({ type: "METRIC_REPORTED", metric }),
    {
      parse: metricSchema.parse,
    },
  );
  useAlertRaised(
    "alerts",
    (alert) => dispatch({ type: "ALERT_RAISED", alert }),
    {
      parse: alertSchema.parse,
    },
  );
  useAlertResolved(
    "alerts",
    (resolution) => dispatch({ type: "ALERT_RESOLVED", resolution }),
    {
      parse: alertResolutionSchema.parse,
    },
  );
  useDeployProgressed(
    "deploys",
    (deploy) => dispatch({ type: "DEPLOY_PROGRESSED", deploy }),
    {
      parse: deploySchema.parse,
    },
  );

  return (
    <div class="grid gap-6 lg:grid-cols-2">
      <MessagesPanel
        roomId={props.roomId}
        messages={state().messages}
        online={state().online}
      />
      <MetricsPanel metrics={state().metrics} />
      <AlertsPanel alerts={state().alerts} />
      <DeploysPanel deploys={state().deploys} />
    </div>
  );
};
