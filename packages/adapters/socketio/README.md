# @priemskiyyy/simulcast-socketio

[Socket.IO](https://socket.io/) adapter for [simulcast](../../core). Requires `socket.io-client` 4.

## Installation

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-socketio socket.io-client
```

## Create a client

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { socketio } from "@priemskiyyy/simulcast-socketio";

const realtime = new RealtimeClient({
  adapter: socketio({
    url: "https://example.com",
    options: { auth: { token } },
  }),
});
```

## Behavior

A channel is a Socket.IO event name: `realtime.channel("message-created")` receives every `message-created` event. Rooms are joined by the server, so the adapter sends nothing when a channel is demanded. Publications carry the first event argument in `data` and all arguments in `native`. A channel reports `subscribed` while the socket is connected and `subscribing` while Socket.IO reconnects; a disconnect Socket.IO will not retry reports `disconnected` and `unsubscribed`.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
