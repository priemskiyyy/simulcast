# @priemskiyyy/simulcast-partykit

[PartyKit](https://www.partykit.io/) and [PartyServer](https://github.com/cloudflare/partykit) adapter for [simulcast](../../core), built on `partysocket`. Requires `partysocket` 1.

## Installation

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-partykit partysocket
```

## Create a client

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { partykit } from "@priemskiyyy/simulcast-partykit";

const realtime = new RealtimeClient({
  adapter: partykit({
    host: "chat.example.partykit.dev",
    party: "chat",
    query: () => ({ token: readToken() }),
  }),
});
```

## Behavior

A channel is a room: subscribing to `realtime.channel("lobby")` opens one `PartySocket` to that room and every message on it becomes a publication with the raw `event.data` in `data` and the `MessageEvent` in `native`. Parse in `useChannel` with `parse`. The options are `PartySocket`'s own, minus `room`.

There is no shared connection, so a session reports `connected` immediately and each room carries its own state: `subscribing` until the socket opens or while `partysocket` reconnects, `subscribed` while open. The connection-level `realtime.native.get()` is `null`; the high-level channel handle exposes subscription and status, not the room socket. This adapter receives room messages. Use a separate application publishing path when you need to send.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
