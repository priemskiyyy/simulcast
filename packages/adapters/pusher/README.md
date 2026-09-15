# @priemskiyyy/simulcast-pusher

[Pusher Channels](https://pusher.com/channels) adapter for [simulcast](../../core). Requires `pusher-js` 8.

## Installation

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-pusher pusher-js
```

## Create a client

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { pusher } from "@priemskiyyy/simulcast-pusher";

const realtime = new RealtimeClient({
  adapter: pusher({
    key: PUSHER_KEY,
    options: {
      cluster: "eu",
      channelAuthorization: { endpoint: "/pusher/auth" },
    },
  }),
});
```

## Behavior

Every application event on a channel becomes a publication whose `event` is the Pusher event name and whose `native` is `{ event, data }`. `pusher:subscription_succeeded` and `pusher:subscription_error` become channel state and error; other `pusher:` events, such as presence members, are not publications and stay available on the native channel through `realtime.native`. A channel that loses its connection reports `subscribing` until Pusher resubscribes it.

`pusher-js` keeps every constructed client in a static `Pusher.instances` list, so a long-lived page that replaces sessions often retains those instances.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
