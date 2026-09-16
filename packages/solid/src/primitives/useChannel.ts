import { createEffect, createMemo, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";
import { useRealtimeClient } from "src/primitives/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";
import type { PublicationHandler } from "src/types/PublicationHandler";
import type { RegisteredPublication } from "src/types/Register";
import { access } from "src/utils/internal/access";

export type UseChannelOptions<TData = unknown> = {
  /** Whether this listener is active. Defaults to true. */
  enabled?: boolean | Accessor<boolean>;
  /** Validates or transforms publication data before the callback receives it. */
  parse?: (data: unknown) => TData;
};

/**
 * Handles publications on a shared channel subscription for the owner's
 * lifetime. An accessor channel resubscribes when it changes. Supply `parse`
 * for runtime validation; an explicit `TData` only declares the wire type.
 *
 * @example
 * ```ts
 * useChannel<{ text: string }>(() => `rooms:${roomId()}`, (message) => {
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

  const handlePublication = (publication: RegisteredPublication) => {
    if (typeof options.parse !== "function") {
      return onEvent(publication.data as TData, publication);
    }

    return onEvent(options.parse(publication.data), publication);
  };

  // Memos compare by value, so an unchanged channel never resubscribes.
  const name = createMemo(() => access(channel));
  const enabled = createMemo(() => access(options.enabled) ?? true);

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    onCleanup(client().channel(name()).subscribe(handlePublication));
  });
};
