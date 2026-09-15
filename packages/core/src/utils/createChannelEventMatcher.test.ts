import { expect, test, vi } from "vitest";
import { createChannelEventMatcher } from "src/utils/createChannelEventMatcher";

type Events = {
  "message.created": { channel: `rooms:${string}`; payload: string };
  "presence.changed": { channel: "presence"; payload: boolean };
};

test("matches the provider event name by default and parses only matching payloads", () => {
  const match = createChannelEventMatcher<Events>();
  const parse = vi.fn((data: unknown) => String(data));

  expect(match({ data: 1, native: null }, "message.created", parse)).toBeNull();
  expect(
    match(
      { event: "presence.changed", data: 1, native: null },
      "message.created",
      parse,
    ),
  ).toBeNull();
  expect(
    match(
      { event: "message.created", data: 42, native: null },
      "message.created",
      parse,
    ),
  ).toEqual({ payload: "42" });
  expect(parse).toHaveBeenCalledExactlyOnceWith(42);
  expect(
    match(
      { event: "message.created", data: null, native: null },
      "message.created",
    ),
  ).toEqual({ payload: null });
});

test("a custom decoder reads the event from anywhere in the publication", () => {
  const match = createChannelEventMatcher<Events>({
    decode: ({ data }) => {
      if (typeof data !== "object" || data === null || !("name" in data)) {
        return null;
      }

      if (typeof data.name !== "string" || !("body" in data)) {
        return null;
      }

      return { eventType: data.name, payload: data.body };
    },
  });

  expect(match({ data: "plain", native: null }, "presence.changed")).toBeNull();
  expect(
    match(
      { data: { name: "presence.changed", body: true }, native: null },
      "presence.changed",
    ),
  ).toEqual({ payload: true });
});
