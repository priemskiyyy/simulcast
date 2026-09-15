import type { ChannelState } from "ably";
import type { AdapterSubscriptionState } from "simulcast";

// `suspended` reattaches once the connection returns; `detached` and `failed` stay put.
export const SUBSCRIPTION_STATES: Record<
  ChannelState,
  AdapterSubscriptionState
> = {
  initialized: "subscribing",
  attaching: "subscribing",
  attached: "subscribed",
  detaching: "unsubscribed",
  detached: "unsubscribed",
  suspended: "subscribing",
  failed: "unsubscribed",
};
