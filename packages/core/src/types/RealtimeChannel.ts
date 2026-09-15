import type { ChannelStatus } from "src/types/ChannelStatus";
import type { ObservableValue } from "src/types/ObservableValue";
import type { RealtimePublication } from "src/types/RealtimePublication";

/**
 * Logical channel handle. `subscribe` creates demand for one shared native
 * subscription; `status` observes it without creating any.
 */
export type RealtimeChannel<TNativePublication = unknown> = {
  subscribe: (
    onPublication: (
      publication: RealtimePublication<TNativePublication>,
    ) => void | Promise<unknown>,
  ) => () => void;
  status: ObservableValue<ChannelStatus>;
};
