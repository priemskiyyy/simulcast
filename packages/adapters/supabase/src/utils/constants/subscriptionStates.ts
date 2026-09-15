import type { REALTIME_SUBSCRIBE_STATES } from "@supabase/realtime-js";
import type { AdapterSubscriptionState } from "@priemskiyyy/simulcast";

// realtime-js rejoins after errors and timeouts until the channel is removed.
export const SUBSCRIPTION_STATES: Record<
  `${REALTIME_SUBSCRIBE_STATES}`,
  AdapterSubscriptionState
> = {
  SUBSCRIBED: "subscribed",
  TIMED_OUT: "subscribing",
  CHANNEL_ERROR: "subscribing",
  CLOSED: "unsubscribed",
};
