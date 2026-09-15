import type { SubscriptionState } from "centrifuge";
import type { AdapterSubscriptionState } from "@priemskiyyy/simulcast";

// Centrifugo's `subscribing` already covers resubscribe attempts, so the states map one to one.
export const SUBSCRIPTION_STATES: Record<
  `${SubscriptionState}`,
  AdapterSubscriptionState
> = {
  unsubscribed: "unsubscribed",
  subscribing: "subscribing",
  subscribed: "subscribed",
};
