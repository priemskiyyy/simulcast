# simulcast-sse

Server-Sent Events adapter for [simulcast](../../core): one `EventSource` per channel, for streaming endpoints on Workers, Hono, or any HTTP server.

## Installation

```sh
pnpm add simulcast simulcast-sse
```

## Create a client

```ts
import { RealtimeClient } from "simulcast";
import { sse } from "simulcast-sse";

const realtime = new RealtimeClient({
  adapter: sse({
    url: (channel) => `/events/${encodeURIComponent(channel)}`,
    events: ["created", "deleted"],
    withCredentials: true,
  }),
});
```

## Behavior

`url` builds the stream URL for a channel. Plain `message` events become publications without an `event`; names listed in `events` are delivered with that name, because `EventSource` has no wildcard. `data` is the event's string payload and `native` the `MessageEvent`.

There is no shared connection, so a session reports `connected` immediately and each channel carries its own state: `subscribing` until the stream opens or while the browser retries after an error, `subscribed` while open, and `unsubscribed` once the browser gives up. Pass `eventSource` to run outside a browser.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
