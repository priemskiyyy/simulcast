import { useEffect, useEffectEvent } from "react";
import type { RealtimePublication } from "@priemskiyyy/simulcast";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";
import type { PublicationHandler } from "src/types/PublicationHandler";

export type UseChannelOptions<TData = unknown> = {
  /** Whether this listener is active. Defaults to true. */
  enabled?: boolean;
  /** Validates or transforms publication data before the callback receives it. */
  parse?: (data: unknown) => TData;
};

/**
 * Handles publications on a shared channel subscription and cleans up on unmount.
 * Supply `parse` for runtime validation; an explicit `TData` only declares the wire type.
 *
 * @example
 * ```ts
 * useChannel<{ text: string }>("rooms:general", (message) => {
 *   console.log(message.text);
 * });
 * ```
 */
export const useChannel = <TData = unknown>(
  channel: ChannelInput,
  onEvent: PublicationHandler<TData>,
  options: UseChannelOptions<TData> = {},
) => {
  const client = useRealtimeClient();

  const enabled = options.enabled ?? true;

  const handlePublication = useEffectEvent(
    (publication: RealtimePublication) => {
      if (typeof options.parse !== "function") {
        return onEvent(publication.data as TData, publication);
      }

      return onEvent(options.parse(publication.data), publication);
    },
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return client
      .channel(channel)
      .subscribe((publication) => handlePublication(publication));
  }, [client, channel, enabled]);
};
