/**
 * What an adapter knows about a state it reports, beyond the state itself.
 * Only `subscribed` carries one, and only from providers that recover.
 */
export type AdapterSubscriptionDetail = {
  /** Whether the provider replayed the publications missed while away. */
  recovered: boolean;
};
