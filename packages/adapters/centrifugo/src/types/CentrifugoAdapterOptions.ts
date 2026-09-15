import type { Centrifuge, SubscriptionOptions } from "centrifuge";

export type CentrifugoAdapterOptions = {
  transport: ConstructorParameters<typeof Centrifuge>[0];
  options?: ConstructorParameters<typeof Centrifuge>[1];
  /** Per-channel subscription options, such as `getToken` for private channels. */
  getSubscriptionOptions?: (channel: string) => SubscriptionOptions;
};
