import type {
  RealtimeClient,
  RealtimePublication,
} from "@priemskiyyy/simulcast";

/**
 * Declaration-merging target that types every export of this package with the
 * application's client. Augment it once, next to the client:
 *
 * @example
 * ```ts
 * declare module "@priemskiyyy/simulcast-svelte" {
 *   interface Register {
 *     client: typeof realtime;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- declaration merging needs an interface.
export interface Register {}

/** The registered client, or an untyped `RealtimeClient` when nothing is registered. */
export type RegisteredClient = Register extends {
  client: infer TClient extends RealtimeClient<unknown, unknown, unknown>;
}
  ? TClient
  : RealtimeClient;

/** The native connection of the registered client's adapter. */
export type RegisteredNativeConnection =
  RegisteredClient extends RealtimeClient<
    infer TNativeConnection,
    unknown,
    unknown
  >
    ? TNativeConnection
    : unknown;

/** A publication as the registered client's adapter delivers it. */
export type RegisteredPublication =
  RegisteredClient extends RealtimeClient<
    unknown,
    infer TNativePublication,
    unknown
  >
    ? RealtimePublication<TNativePublication>
    : RealtimePublication;

/** The native subscription the registered client's adapter creates per channel. */
export type RegisteredNativeSubscription =
  RegisteredClient extends RealtimeClient<
    unknown,
    unknown,
    infer TNativeSubscription
  >
    ? TNativeSubscription
    : unknown;
