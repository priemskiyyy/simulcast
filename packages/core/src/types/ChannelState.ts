import type { AdapterSubscriptionState } from "src/types/AdapterSubscriptionState";

/** `detached` means the core holds no native subscription for the channel. */
export type ChannelState = "detached" | AdapterSubscriptionState;
