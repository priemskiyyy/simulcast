import { expectTypeOf } from "vitest";
import type { RealtimeClient } from "@priemskiyyy/simulcast";
import type { RealtimePublication } from "@priemskiyyy/simulcast";
import type { RealtimeProviderProps } from "src/context/RealtimeProvider";
import { useChannel } from "src/hooks/useChannel";
import type { PublicationHandler } from "src/types/PublicationHandler";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";
import type {
  RegisteredClient,
  RegisteredPublication,
} from "src/types/Register";
import { useNativeConnection } from "src/hooks/useNativeConnection";
import { createChannelEventHooks } from "src/hooks/createChannelEventHooks";

type Message = { text: string };
const handleMessage: PublicationHandler<Message> = () => {};
type Events = {
  "message.created": { channel: `rooms:${string}`; payload: Message };
  "presence.changed": { channel: "presence"; payload: boolean };
};

const { useChannelEvent } = createChannelEventHooks<Events>({
  decode: () => null,
});

// A client created with a typed adapter is accepted by the untyped provider.
expectTypeOf<RealtimeClient<{ id: string }, { offset: number }>>().toExtend<
  RealtimeProviderProps["client"]
>();

export const useTypeContracts = () => {
  // Nothing is registered inside the package, so the native client is unknown.
  expectTypeOf<RegisteredClient>().toEqualTypeOf<RealtimeClient>();
  expectTypeOf<RegisteredPublication>().toEqualTypeOf<RealtimePublication>();
  expectTypeOf(useNativeConnection()).toEqualTypeOf<unknown>();

  expectTypeOf(useRealtimeClient()).toEqualTypeOf<RealtimeClient>();

  useChannel("rooms:one", (data) => {
    expectTypeOf(data).toEqualTypeOf<unknown>();
  });
  useChannel<Message>("rooms:one", (data) => {
    expectTypeOf(data).toEqualTypeOf<Message>();
  });
  useChannel(
    "rooms:one",
    (data) => {
      expectTypeOf(data).toEqualTypeOf<number>();
    },
    { parse: Number },
  );
  useChannelEvent("rooms:one", "message.created", (data) => {
    expectTypeOf(data).toEqualTypeOf<Message>();
  });
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
