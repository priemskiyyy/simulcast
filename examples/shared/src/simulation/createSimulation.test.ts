import { afterEach, expect, test, vi } from "vitest";
import type { Publication } from "../realtime/Envelope";
import { alertResolutionSchema } from "../schemas/alertResolutionSchema";
import { alertSchema } from "../schemas/alertSchema";
import { deploySchema } from "../schemas/deploySchema";
import { messageSchema } from "../schemas/messageSchema";
import { metricSchema } from "../schemas/metricSchema";
import { createSimulation } from "./createSimulation";

afterEach(() => {
  vi.useRealTimers();
});

const setup = (random: () => number) => {
  const publications: Publication[] = [];
  const simulation = createSimulation({
    publish: (publication) => publications.push(publication),
    roomId: "demo",
    random,
    now: () => Date.parse("2026-09-15T10:00:00.000Z"),
  });

  return { publications, simulation };
};

test("every published body matches its schema and targets the current room", () => {
  const { publications, simulation } = setup(() => 0.42);

  simulation.sendMessage();
  simulation.reportMetrics();
  simulation.raiseAlert();
  simulation.advanceDeploy();
  simulation.resolveAlert();

  const [message, ...rest] = publications;
  expect(message?.channel).toBe("rooms:demo");
  expect(messageSchema.parse(message?.envelope.body).author).toBe("Linus");
  expect(
    rest.filter((p) => p.envelope.name === "metric.reported"),
  ).toHaveLength(3);
  for (const publication of rest) {
    if (publication.envelope.name === "metric.reported") {
      expect(metricSchema.parse(publication.envelope.body)).toBeTruthy();
    }
  }
  const alert = rest.find((p) => p.envelope.name === "alert.raised");
  const resolution = rest.find((p) => p.envelope.name === "alert.resolved");
  expect(alertSchema.parse(alert?.envelope.body).id).toEqual(
    alertResolutionSchema.parse(resolution?.envelope.body).id,
  );
  simulation.setRoom("ops");
  simulation.sendMessage();
  expect(publications.at(-1)?.channel).toBe("rooms:ops");
  expect(deploySchema.parse(rest.at(-2)?.envelope.body).stage).toBe("BUILDING");
});

test("start publishes on an interval once and stop is idempotent", () => {
  vi.useFakeTimers();
  const { publications, simulation } = setup(() => 0.1);

  simulation.start();
  simulation.start();
  expect(simulation.isRunning()).toBe(true);
  const initial = publications.length;
  vi.advanceTimersByTime(3_000);
  expect(publications.length).toBeGreaterThan(initial);
  simulation.stop();
  simulation.stop();
  const stopped = publications.length;
  vi.advanceTimersByTime(3_000);
  expect(publications.length).toBe(stopped);
  expect(simulation.isRunning()).toBe(false);
});
