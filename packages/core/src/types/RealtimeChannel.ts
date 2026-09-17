import type { ChannelStatus } from "src/types/ChannelStatus";
import type { ObservableValue } from "src/types/ObservableValue";
import type { RealtimePublication } from "src/types/RealtimePublication";

/**
 * Logical channel handle. `subscribe` creates demand for one shared native
 * subscription; `status` and `native` observe it without creating any.
 */
export type RealtimeChannel<
  TNativePublication = unknown,
  TNativeSubscription = unknown,
> = {
  subscribe: (
    onPublication: (
      publication: RealtimePublication<TNativePublication>,
    ) => void | Promise<unknown>,
  ) => () => void;
  status: ObservableValue<ChannelStatus>;
  /**
   * The adapter's native subscription for this channel, or `null` while none
   * exists. Observing it never opens one: it follows the subscription a
   * publication consumer demanded, and returns to `null` when that is released.
   */
  native: ObservableValue<TNativeSubscription | null>;
};
