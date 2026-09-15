# @priemskiyyy/simulcast-centrifugo

[Centrifugo](https://centrifugal.dev/) adapter for [simulcast](../../core). Requires Centrifuge JS `>=5.7.2 <6`.

## Installation

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-centrifugo centrifuge
```

## Create a client

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";

const realtime = new RealtimeClient({
  adapter: centrifugo({
    transport: "wss://example.com/connection/websocket",
    options: { getToken: () => fetchConnectionToken() },
    getSubscriptionOptions: (channel) => ({
      getToken: () => fetchSubscriptionToken(channel),
    }),
  }),
});
```

## Behavior

Every session gets a fresh `Centrifuge` instance. Publications keep the SDK's `PublicationContext` in `publication.native`; the SDK's coarse client and subscription states are the contract's states.

`@priemskiyyy/simulcast-centrifugo/react` exports `useCentrifuge()`, which returns the current native client, or `null` while no Centrifugo session is active. It requires `react` and `@priemskiyyy/simulcast-react`.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
