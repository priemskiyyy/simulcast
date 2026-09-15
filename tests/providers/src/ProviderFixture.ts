import type { RealtimeAdapter } from "@priemskiyyy/simulcast";

export type ProviderFixture = {
  adapter: RealtimeAdapter;
  publish: (channel: string, text: string) => Promise<void>;
  ready: (channel: string) => Promise<void>;
};

export type NetworkProviderFixture = ProviderFixture & {
  connections: () => number;
  accepted: () => number;
  drop: () => void;
};
