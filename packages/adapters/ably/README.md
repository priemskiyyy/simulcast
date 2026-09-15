# simulcast-ably

[Ably](https://ably.com/) adapter for [simulcast](../../core). Requires `ably` 2.

## Installation

```sh
pnpm add simulcast simulcast-ably ably
```

## Create a client

```ts
import { RealtimeClient } from "simulcast";
import { ably } from "simulcast-ably";

const realtime = new RealtimeClient({
  adapter: ably({
    options: { authUrl: "/ably/token" },
    getChannelOptions: () => ({ params: { rewind: "1" } }),
  }),
});
```

## Behavior

Each Ably message becomes a publication whose `event` is the message name, when present, and whose `native` is the `InboundMessage`. Channel states map by meaning: `attaching` and `suspended` report `subscribing` because Ably keeps retrying, while `detached` and `failed` report `unsubscribed`. Connection `disconnected` and `suspended` likewise report `connecting`. State change reasons are reported as errors. Presence, history, and rewind stay on the native channel through `realtime.native`.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
