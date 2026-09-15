import type { AdapterSubscriptionObserver } from "src/types/AdapterSubscriptionObserver";

export type AdapterSubscribeRequest<TNativePublication = unknown> = {
  channel: string;
  observer: AdapterSubscriptionObserver<TNativePublication>;
};
