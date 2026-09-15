import { expect, test } from "vitest";
import type { RecordedEvent } from "src/utils/EventLog";
import { filterEvents } from "src/utils/filterEvents";

const event = (overrides: Partial<RecordedEvent>): RecordedEvent => ({
  id: 1,
  source: "channel",
  channel: "rooms:one",
  type: "publication",
  timestamp: 0,
  context: "{}",
  summary: "",
  kind: "PUBLICATION",
  ...overrides,
});
const events = [
  event({ id: 1, summary: "hello" }),
  event({ id: 2, channel: "rooms:two", summary: "other" }),
  event({
    id: 3,
    source: "connection",
    channel: null,
    type: "state",
    kind: "LIFECYCLE",
    summary: "connected",
  }),
  event({ id: 4, type: "error", kind: "ERROR", summary: "boom" }),
];
const ids = (filtered: RecordedEvent[]) => filtered.map((entry) => entry.id);

test("a selected channel keeps connection events, and query and kind narrow further", () => {
  expect(
    ids(filterEvents(events, { channel: null, query: "", kind: null })),
  ).toEqual([1, 2, 3, 4]);
  expect(
    ids(filterEvents(events, { channel: "rooms:one", query: "", kind: null })),
  ).toEqual([1, 3, 4]);
  expect(
    ids(filterEvents(events, { channel: null, query: " HELLO ", kind: null })),
  ).toEqual([1]);
  expect(
    ids(
      filterEvents(events, { channel: "rooms:one", query: "", kind: "ERROR" }),
    ),
  ).toEqual([4]);
});
