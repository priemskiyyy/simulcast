import type { RealtimePublication } from "simulcast";
import type { ChannelInput } from "../types/ChannelInput.js";
import type { PublicationHandler } from "../types/PublicationHandler.js";
import { extract } from "./internal/extract.js";
import { useRealtimeClient } from "./useRealtimeClient.js";

export type UseChannelOptions<TData = unknown> = {
  /** Whether this listener is active. Defaults to true. */
  enabled?: boolean | (() => boolean);
  /** Validates or transforms publication data before the callback receives it. */
  parse?: (data: unknown) => TData;
};

/**
 * Handles publications on a shared channel subscription for the component's
 * lifetime. A getter channel resubscribes when it changes. Supply `parse` for
 * runtime validation; an explicit `TData` only declares the wire type.
 * Call it during component initialisation.
 *
 * @example
 * ```ts
 * useChannel<{ text: string }>(() => `rooms:${roomId}`, (message) => {
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

  const handlePublication = (publication: RealtimePublication) => {
    if (typeof options.parse !== "function") {
      return onEvent(publication.data as TData, publication);
    }

    return onEvent(options.parse(publication.data), publication);
  };

  // Deriveds only change by value, so an unchanged channel never resubscribes.
  const name = $derived(extract(channel));
  const enabled = $derived(extract(options.enabled) ?? true);

  $effect(() => {
    if (!enabled) {
      return;
    }

    return client.current.channel(name).subscribe(handlePublication);
  });
};
