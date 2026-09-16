import { onMounted, onWatcherCleanup, toValue, watch } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { useRealtimeClient } from "src/composables/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";
import type { PublicationHandler } from "src/types/PublicationHandler";
import type { RegisteredPublication } from "src/types/Register";

export type UseChannelOptions<TData = unknown> = {
  /** Whether this listener is active. Defaults to true. */
  enabled?: MaybeRefOrGetter<boolean>;
  /** Validates or transforms publication data before the callback receives it. */
  parse?: (data: unknown) => TData;
};

/**
 * Handles publications on a shared channel subscription for the component's
 * lifetime. A ref or getter channel resubscribes when it changes. Supply `parse`
 * for runtime validation; an explicit `TData` only declares the wire type.
 *
 * @example
 * ```ts
 * useChannel<{ text: string }>(() => `rooms:${roomId.value}`, (message) => {
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

  onMounted(() => {
    watch(
      [
        () => client.value,
        () => toValue(channel),
        () => toValue(options.enabled) ?? true,
      ],
      ([current, name, enabled]) => {
        if (!enabled) {
          return;
        }

        onWatcherCleanup(current.channel(name).subscribe(handlePublication));
      },
      { immediate: true },
    );
  });
};
