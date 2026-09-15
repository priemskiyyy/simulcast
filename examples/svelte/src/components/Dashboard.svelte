<script lang="ts">
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
  import AlertsPanel from "src/components/AlertsPanel.svelte";
  import DeploysPanel from "src/components/DeploysPanel.svelte";
  import MessagesPanel from "src/components/MessagesPanel.svelte";
  import MetricsPanel from "src/components/MetricsPanel.svelte";
  import { useAlertRaised } from "src/hooks/generated/useAlertRaised";
  import { useAlertResolved } from "src/hooks/generated/useAlertResolved";
  import { useDeployProgressed } from "src/hooks/generated/useDeployProgressed";
  import { useMessageCreated } from "src/hooks/generated/useMessageCreated";
  import { useMetricReported } from "src/hooks/generated/useMetricReported";
  import { usePresenceChanged } from "src/hooks/generated/usePresenceChanged";

  type DashboardProps = { roomId: string };

  let { roomId }: DashboardProps = $props();

  // Six generated utilities share four subscriptions; every payload is parsed before the reducer sees it.
  let dashboard = $state.raw(initialDashboardState);
  const dispatch = (action: DashboardAction) => {
    dashboard = dashboardReducer(dashboard, action);
  };
  const room = () => `rooms:${roomId}` as const;

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
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <MessagesPanel
    {roomId}
    messages={dashboard.messages}
    online={dashboard.online}
  />
  <MetricsPanel metrics={dashboard.metrics} />
  <AlertsPanel alerts={dashboard.alerts} />
  <DeploysPanel deploys={dashboard.deploys} />
</div>
