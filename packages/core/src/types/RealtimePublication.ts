/**
 * One message delivered on a channel. `data` is untyped on purpose: consumers
 * parse it. `event` is the provider-level event name where the provider has
 * that concept; Centrifugo publications omit it. `native` is the provider's
 * own publication context, never modified by the core.
 */
export type RealtimePublication<TNative = unknown> = {
  data: unknown;
  event?: string;
  native: TNative;
};
