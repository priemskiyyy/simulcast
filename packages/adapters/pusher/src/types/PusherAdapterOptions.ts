import type Pusher from "pusher-js";

export type PusherAdapterOptions = {
  key: string;
  options: ConstructorParameters<typeof Pusher>[1];
};
