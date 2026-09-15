import { expect, test, vi } from "vitest";
import { Diagnostics } from "src/utils/internal/Diagnostics";

const createDiagnostics = () =>
  new Diagnostics(() => ({
    adapter: "test",
    session: null,
    connection: "disconnected",
    channels: [],
  }));

test("snapshots are stable between changes and notifications are batched", async () => {
  const diagnostics = createDiagnostics();
  const notify = vi.fn();
  const stop = diagnostics.api.subscribe(notify);
  const first = diagnostics.api.get();
  expect(diagnostics.api.get()).toBe(first);
  diagnostics.changed();
  diagnostics.changed();
  expect(diagnostics.api.get()).not.toBe(first);
  expect(notify).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(notify).toHaveBeenCalledTimes(1);
  diagnostics.changed();
  stop();
  await Promise.resolve();
  expect(notify).toHaveBeenCalledTimes(1);
});

test("events are recorded only while an observer is present", () => {
  const diagnostics = createDiagnostics();
  const now = vi.spyOn(Date, "now").mockReturnValue(42);
  const listener = vi.fn();
  diagnostics.record("runtime", "ignored", {});
  const stop = diagnostics.api.events.subscribe(listener);
  diagnostics.record("channel", "state", "subscribed", "rooms:one");
  stop();
  stop();
  diagnostics.record("runtime", "ignored", {});

  expect(listener).toHaveBeenCalledExactlyOnceWith({
    source: "channel",
    type: "state",
    context: "subscribed",
    channel: "rooms:one",
    timestamp: 42,
  });
  now.mockRestore();
});
