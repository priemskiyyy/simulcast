# simulcast-phoenix

[Phoenix Channels](https://hexdocs.pm/phoenix/channels.html) adapter for [simulcast](../../core). Requires `phoenix` 1.7 or newer.

## Installation

```sh
pnpm add simulcast simulcast-phoenix phoenix
```

## Create a client

```ts
import { RealtimeClient } from "simulcast";
import { phoenix } from "simulcast-phoenix";

const realtime = new RealtimeClient({
  adapter: phoenix({
    url: "wss://example.com/socket",
    options: { params: { token } },
    getChannelParams: (channel) => ({ token: channelToken(channel) }),
  }),
});
```

## Behavior

A channel is a Phoenix topic. Every event the server pushes on it becomes a publication whose `event` is the event name and whose `native` holds the event, payload, and ref; `phx_` and reply frames are not publications. A successful join reports `subscribed`; rejected joins report the reason as an error and `subscribing`. A timed out join reports `subscribing` without a separate error. Phoenix keeps rejoining until the channel leaves. The socket reports `connecting` after every close for the same reason.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
