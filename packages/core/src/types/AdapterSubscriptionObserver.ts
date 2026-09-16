import type { AdapterError } from "src/types/AdapterError";
import type { AdapterSubscriptionState } from "src/types/AdapterSubscriptionState";
import type { AdapterSubscriptionDetail } from "src/types/AdapterSubscriptionDetail";
import type { RealtimePublication } from "src/types/RealtimePublication";

/** Callbacks an adapter subscription reports into. Silent once disposal starts. */
export type AdapterSubscriptionObserver<TNativePublication = unknown> = {
  publication: (publication: RealtimePublication<TNativePublication>) => void;
  state: (
    state: AdapterSubscriptionState,
    detail?: AdapterSubscriptionDetail,
  ) => void;
  error: (error: AdapterError) => void;
};
