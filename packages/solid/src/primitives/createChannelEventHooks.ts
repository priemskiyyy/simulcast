import { createChannelEventMatcher } from "simulcast";
import type { ChannelEventConfiguration, EventDefinition } from "simulcast";
import { useChannel } from "src/primitives/useChannel";
import type { UseChannelOptions } from "src/primitives/useChannel";
import type { ChannelInput } from "src/types/ChannelInput";
import type { PublicationHandler } from "src/types/PublicationHandler";
import { access } from "src/utils/internal/access";

/**
 * Creates a `useChannelEvent` primitive typed by your event map. Providers with
 * named events need no decoder; supply one to read an envelope out of the data.
 * Create it once outside your components.
 *
 * @example
 * ```ts
 * type Events = {
 *   "count.updated": { channel: "visitors"; payload: number };
 * };
 * const { useChannelEvent } = createChannelEventHooks<Events>();
 * ```
 */
export const createChannelEventHooks = <
  TEvents extends { [TKey in keyof TEvents]: EventDefinition },
>(
  configuration: ChannelEventConfiguration = {},
) => {
  const match = createChannelEventMatcher<TEvents>(configuration);

  const useChannelEvent = <TEvent extends Extract<keyof TEvents, string>>(
    channel: ChannelInput<TEvents[NoInfer<TEvent>]["channel"]>,
    eventType: TEvent,
    onEvent: PublicationHandler<TEvents[NoInfer<TEvent>]["payload"]>,
    options: UseChannelOptions<TEvents[NoInfer<TEvent>]["payload"]> = {},
  ) => {
    useChannel(
      () => access(channel),
      (_data, publication) => {
        const event = match(publication, eventType, options.parse);

        if (event === null) {
          return;
        }

        return onEvent(event.payload, publication);
      },
      { enabled: options.enabled ?? true },
    );
  };

  return {
    /**
     * Handles matching decoded events; other publications are ignored.
     * Channel and payload types follow `eventType`; use `parse` for runtime validation.
     *
     * @example
     * ```ts
     * useChannelEvent("visitors", "count.updated", (count) => {
     *   console.log(count.toFixed());
     * });
     * ```
     */
    useChannelEvent,
  };
};
