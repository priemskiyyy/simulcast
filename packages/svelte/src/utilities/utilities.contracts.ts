import { expectTypeOf } from "vitest";
import type { RealtimeClient } from "simulcast";
import type {
  PublicationHandler,
  ReadableBox,
  RealtimeProviderProps,
} from "../index.js";
import {
  createChannelEventHooks,
  useChannel,
  useRealtimeClient,
} from "../index.js";

type Message = { text: string };
const handleMessage: PublicationHandler<Message> = () => {};
type Events = {
  "message.created": { channel: `rooms:${string}`; payload: Message };
  "presence.changed": { channel: "presence"; payload: boolean };
};

const { useChannelEvent } = createChannelEventHooks<Events>();

// A client created with a typed adapter is accepted by the untyped provider.
expectTypeOf<RealtimeClient<{ id: string }, { offset: number }>>().toExtend<
  RealtimeProviderProps["client"]
>();

export const useTypeContracts = () => {
  expectTypeOf(useRealtimeClient()).toEqualTypeOf<
    ReadableBox<RealtimeClient>
  >();

  useChannel("rooms:one", (data) => {
    expectTypeOf(data).toEqualTypeOf<unknown>();
  });
  useChannel<Message>(
    () => "rooms:one",
    (data) => {
      expectTypeOf(data).toEqualTypeOf<Message>();
    },
  );
  useChannel(
    "rooms:one",
    (data) => {
      expectTypeOf(data).toEqualTypeOf<number>();
    },
    { parse: Number, enabled: () => true },
  );
  useChannelEvent(
    () => "rooms:one",
    "message.created",
    (data) => {
      expectTypeOf(data).toEqualTypeOf<Message>();
    },
  );
  useChannelEvent("presence", "presence.changed", (data) => {
    expectTypeOf(data).toEqualTypeOf<boolean>();
  });

  useChannel(
    "rooms:one",
    (data: number) => {
      data.toFixed();
    },
    { parse: (raw) => Number(raw) },
  );
  useChannel(
    "rooms:one",
    (data) => {
      expectTypeOf(data).toEqualTypeOf<number>();
    },
    { parse: (raw: unknown) => Number(raw) },
  );
  // @ts-expect-error A handler's declared payload must agree with the parser.
  useChannel("rooms:one", handleMessage, { parse: Number });

  // @ts-expect-error A channel cannot widen the selected event type.
  useChannelEvent("presence", "message.created", () => {});
  // @ts-expect-error A callback must consume the selected event's payload.
  useChannelEvent("rooms:one", "message.created", (data: boolean) => {
    return data;
  });
  // @ts-expect-error A parser must produce the declared event payload.
  useChannelEvent("rooms:one", "message.created", () => {}, { parse: Number });
  // @ts-expect-error An explicit wire contract must agree with the parser.
  useChannel<Message>("rooms:one", () => {}, { parse: Number });
};
