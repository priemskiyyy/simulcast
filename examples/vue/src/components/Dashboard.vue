<script setup lang="ts">
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
import { shallowRef } from "vue";
import AlertsPanel from "src/components/AlertsPanel.vue";
import DeploysPanel from "src/components/DeploysPanel.vue";
import MessagesPanel from "src/components/MessagesPanel.vue";
import MetricsPanel from "src/components/MetricsPanel.vue";
import { useAlertRaised } from "src/hooks/generated/useAlertRaised";
import { useAlertResolved } from "src/hooks/generated/useAlertResolved";
import { useDeployProgressed } from "src/hooks/generated/useDeployProgressed";
import { useMessageCreated } from "src/hooks/generated/useMessageCreated";
import { useMetricReported } from "src/hooks/generated/useMetricReported";
import { usePresenceChanged } from "src/hooks/generated/usePresenceChanged";

type DashboardProps = { roomId: string };

const props = defineProps<DashboardProps>();

// Six generated composables share four subscriptions; every payload is parsed before the reducer sees it.
const state = shallowRef(initialDashboardState);
const dispatch = (action: DashboardAction) => {
  state.value = dashboardReducer(state.value, action);
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
useAlertRaised("alerts", (alert) => dispatch({ type: "ALERT_RAISED", alert }), {
  parse: alertSchema.parse,
});
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

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <MessagesPanel
      :room-id="roomId"
      :messages="state.messages"
      :online="state.online"
    />
    <MetricsPanel :metrics="state.metrics" />
    <AlertsPanel :alerts="state.alerts" />
    <DeploysPanel :deploys="state.deploys" />
  </div>
</template>
