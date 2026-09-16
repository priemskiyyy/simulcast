import type { createRealtimeClient } from "example-shared";
import type { RegisteredNativeConnection } from "@priemskiyyy/simulcast-solid";

/**
 * Types every Simulcast hook with this application's client. The example
 * switches between BroadcastChannel and Centrifugo, so the native connection is
 * `null | Centrifuge` and publications carry `MessageEvent | PublicationContext`.
 */
declare module "@priemskiyyy/simulcast-solid" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface.
  interface Register {
    client: ReturnType<typeof createRealtimeClient>;
  }
}

/** Fails to compile if the registration stops narrowing the native connection away from `unknown`. */
export const REGISTRATION_APPLIED: unknown extends RegisteredNativeConnection
  ? never
  : true = true;
