import { expect, test } from "vitest";
import { dashboardReducer, initialDashboardState } from "./dashboardReducer";

const alert = {
  id: "a1",
  severity: "WARNING",
  text: "Queue depth above threshold",
  raisedAt: "2026-09-15T10:00:00.000Z",
} as const;

test("messages prepend and cap, presence replaces, and metrics remember the previous reading", () => {
  const messages = Array.from({ length: 51 }, (_, index) => ({
    id: `m${index}`,
    author: "Ada",
    text: `message ${index}`,
    sentAt: "2026-09-15T10:00:00.000Z",
  }));
  const withMessages = messages.reduce(
    (state, message) =>
      dashboardReducer(state, { type: "MESSAGE_RECEIVED", message }),
    initialDashboardState,
  );
  expect(withMessages.messages).toHaveLength(50);
  expect(withMessages.messages[0]?.id).toBe("m50");

  const withPresence = dashboardReducer(withMessages, {
    type: "PRESENCE_CHANGED",
    presence: { online: 4 },
  });
  expect(withPresence.online).toBe(4);

  const first = dashboardReducer(withPresence, {
    type: "METRIC_REPORTED",
    metric: { name: "latency", value: 80 },
  });
  const second = dashboardReducer(first, {
    type: "METRIC_REPORTED",
    metric: { name: "latency", value: 60 },
  });
  expect(second.metrics.latency).toEqual({ current: 60, previous: 80 });
  expect(second.metrics.throughput).toBeUndefined();
});

test("alerts replace duplicates and resolve by ID, and deploys upsert by service", () => {
  const raised = dashboardReducer(initialDashboardState, {
    type: "ALERT_RAISED",
    alert,
  });
  const updated = dashboardReducer(raised, {
    type: "ALERT_RAISED",
    alert: { ...alert, severity: "CRITICAL" },
  });
  expect(updated.alerts).toEqual([{ ...alert, severity: "CRITICAL" }]);
  expect(
    dashboardReducer(updated, {
      type: "ALERT_RESOLVED",
      resolution: { id: "a1" },
    }).alerts,
  ).toEqual([]);

  const building = dashboardReducer(initialDashboardState, {
    type: "DEPLOY_PROGRESSED",
    deploy: { service: "api", stage: "BUILDING", percent: 40 },
  });
  const testing = dashboardReducer(building, {
    type: "DEPLOY_PROGRESSED",
    deploy: { service: "api", stage: "TESTING", percent: 0 },
  });
  expect(testing.deploys).toEqual([
    { service: "api", stage: "TESTING", percent: 0 },
  ]);
});
