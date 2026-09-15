# @priemskiyyy/simulcast-broadcast-channel

[BroadcastChannel](https://developer.mozilla.org/docs/Web/API/BroadcastChannel) adapter for [simulcast](../../core): same-origin realtime between tabs, workers, and tests, with no server.

## Installation

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-broadcast-channel
```

## Create a client

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { broadcastChannel } from "@priemskiyyy/simulcast-broadcast-channel";

const realtime = new RealtimeClient({
  adapter: broadcastChannel({ prefix: "app:" }),
});

const disconnect = realtime.connect();
const unsubscribe = realtime.channel("rooms:demo").subscribe((publication) => {
  console.log(publication.data);
});

const publisher = new BroadcastChannel("app:rooms:demo");
publisher.postMessage({ text: "hello" });

// When the application is done listening:
// unsubscribe();
// disconnect();
// publisher.close();
```

## Behavior

A channel is a `BroadcastChannel` name, optionally prefixed. Every posted message becomes a publication with the structured-cloned payload in `data` and the `MessageEvent` in `native`. A session is always `connected` and channels are `subscribed` as soon as they are demanded. It is a convenient way to keep several tabs in sync, to demo hooks without a backend, and to drive integration tests through the same code path a provider would.

BroadcastChannel sends to other instances with the same name, not back to the
sending instance. All participating tabs must share an origin. Its connection-level
native value is `null`; use your own BroadcastChannel instance to publish and close
that instance when finished.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
