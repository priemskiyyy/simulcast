# simulcast-websocket

Generic WebSocket adapter for [simulcast](../../core). Bring your own protocol and use it with a Cloudflare Durable Object, a Hono or Bun route, or any server that multiplexes channels over one socket.

## Installation

```sh
pnpm add simulcast simulcast-websocket
```

## Create a client

```ts
import { RealtimeClient } from "simulcast";
import { websocket } from "simulcast-websocket";

const realtime = new RealtimeClient({
  adapter: websocket({
    url: () => `wss://example.com/realtime?token=${readToken()}`,
    protocol: {
      subscribe: (channel) => JSON.stringify({ type: "subscribe", channel }),
      unsubscribe: (channel) =>
        JSON.stringify({ type: "unsubscribe", channel }),
      decode: ({ data }) => {
        const frame: unknown = JSON.parse(String(data));
        if (typeof frame !== "object" || frame === null) return null;
        if (!("type" in frame) || frame.type !== "publish") return null;
        if (!("channel" in frame) || typeof frame.channel !== "string")
          return null;
        if (!("data" in frame)) return null;
        return { channel: frame.channel, data: frame.data };
      },
    },
  }),
});
```

## Behavior

The protocol has three parts. `subscribe` and `unsubscribe` return the frame to send when a channel gains its first consumer or loses its last one, or `null` when the server pushes everything. `decode` turns an incoming `MessageEvent` into `{ channel, data, event? }`, or `null` to ignore it. Publications keep the `MessageEvent` in `native`.

After a close the adapter waits `reconnectDelay` (1000 ms by default, a function of the attempt and close event if you need backoff, `0` to stop), reopens the socket, resends every demanded `subscribe` frame, and reports `subscribing` then `subscribed` on each channel. `url` may be a function so each attempt carries a fresh token. `realtime.native.get()` exposes a handle with the current `socket` and a `send` method for your own frames.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
