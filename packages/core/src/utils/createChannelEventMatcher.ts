import type { ChannelEventConfiguration } from "src/types/ChannelEventConfiguration";
import type { EventDefinition } from "src/types/EventDefinition";
import type { RealtimePublication } from "src/types/RealtimePublication";
import { decodeProviderEvent } from "src/utils/internal/decodeProviderEvent";

/**
 * Matches publications against one event of an application event map. Every
 * framework binding builds its typed event hook on this; it decodes once,
 * compares the event type, and parses only matching payloads.
 *
 * @example
 * ```ts
 * const match = createChannelEventMatcher<Events>();
 * const event = match(publication, "message.created", messageSchema.parse);
 * if (event !== null) {
 *   console.log(event.payload.text);
 * }
 * ```
 */
export const createChannelEventMatcher = <
  TEvents extends { [TKey in keyof TEvents]: EventDefinition },
>(
  configuration: ChannelEventConfiguration = {},
) => {
  const decode =
    typeof configuration.decode === "function"
      ? configuration.decode
      : decodeProviderEvent;

  return <TEvent extends Extract<keyof TEvents, string>>(
    publication: RealtimePublication,
    eventType: TEvent,
    parse?: (data: unknown) => TEvents[TEvent]["payload"],
  ): { payload: TEvents[TEvent]["payload"] } | null => {
    const event = decode(publication);

    if (event === null) {
      return null;
    }

    if (event.eventType !== eventType) {
      return null;
    }

    if (typeof parse !== "function") {
      return { payload: event.payload };
    }

    return { payload: parse(event.payload) };
  };
};
