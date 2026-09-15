import type { AdapterError } from "src/types/AdapterError";
import type { ChannelState } from "src/types/ChannelState";

export type ChannelStatus = {
  state: ChannelState;
  error: AdapterError | null;
};
