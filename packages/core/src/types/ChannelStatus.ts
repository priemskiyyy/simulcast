import type { AdapterError } from "src/types/AdapterError";
import type { ChannelState } from "src/types/ChannelState";

export type ChannelStatus = {
  state: ChannelState;
  error: AdapterError | null;
  /**
   * Whether the provider replayed the publications missed since the last
   * subscription. `false` means assume a gap: the provider recovered nothing,
   * failed to, or has no recovery to offer.
   */
  recovered: boolean;
};
