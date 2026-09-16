import type { RegisteredNativeConnection } from "@priemskiyyy/simulcast-react";
import type { createRealtimeClient } from "src/realtime/createRealtimeClient";

/**
 * Types every Simulcast hook with this application's client. The example
 * switches between an in-memory simulation and Centrifugo, so the native
 * connection is `null | Centrifuge`.
 */
declare module "@priemskiyyy/simulcast-react" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface.
  interface Register {
    client: ReturnType<typeof createRealtimeClient>["client"];
  }
}

/** Fails to compile if the registration stops narrowing the native connection away from `unknown`. */
export const REGISTRATION_APPLIED: unknown extends RegisteredNativeConnection
  ? never
  : true = true;
