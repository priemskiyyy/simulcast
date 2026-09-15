/**
 * Coarse subscription state reported by an adapter.
 *
 * `subscribing` means publications are not arriving yet and the provider keeps
 * trying on its own. `unsubscribed` means the provider stopped delivering and
 * will not resume for this native subscription.
 */
export type AdapterSubscriptionState =
  "subscribing" | "subscribed" | "unsubscribed";
