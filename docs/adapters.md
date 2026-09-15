---
description: "Compare eleven realtime adapters, install provider SDKs, and understand channel semantics, native access, and connection state mappings."
---

# Adapters

An adapter maps one provider onto the contract the runtime consumes. Each one is
a cold description: constructing it opens nothing, and every session gets fresh
native resources. History, presence, publishing, recovery metadata, and provider-specific error codes
remain SDK concerns. Shared-connection adapters expose their native client.
PartyKit, SSE, and BroadcastChannel have no shared native client; see
[native access](client.md#native-access-depends-on-the-adapter). See [Writing an adapter](writing-an-adapter.md) for the contract.

## How states map

The runtime exposes three connection states and four channel states. Adapters
map richer native states onto them by meaning, not by name: `connecting` and
`subscribing` mean the provider is not delivering yet but keeps trying on its
own; `disconnected` and `unsubscribed` mean it stopped. `detached` means there is
no active native subscription: either no enabled consumer demands the channel,
or the client has no active session. Registered demand alone does not create a
native subscription until a session starts.

Adapters without a shared connection, such as SSE, PartyKit, and
BroadcastChannel, report `connected` as soon as a session starts and carry all
state on their channels.

## Centrifugo

```sh
pnpm add @priemskiyyy/simulcast-centrifugo centrifuge
```

```ts
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";

const adapter = centrifugo({
  transport: "wss://example.com/connection/websocket",
  options: { getToken: () => fetchConnectionToken() },
  getSubscriptionOptions: (channel) => ({
    getToken: () => fetchSubscriptionToken(channel),
  }),
});
```

`transport` and `options` go to the `Centrifuge` constructor unchanged.
Publications carry the `PublicationContext` in `native` and no `event`.
`@priemskiyyy/simulcast-centrifugo/react` exports `useCentrifuge()` for the native client.

States map one to one: Centrifugo's `connecting` and `subscribing` already cover
its own retries.

## Pusher Channels

```sh
pnpm add @priemskiyyy/simulcast-pusher pusher-js
```

```ts
import { pusher } from "@priemskiyyy/simulcast-pusher";

const adapter = pusher({
  key: PUSHER_KEY,
  options: {
    cluster: "eu",
    channelAuthorization: { endpoint: "/pusher/auth" },
  },
});
```

Every application event becomes a publication whose `event` is the Pusher event
name and whose `native` is `{ event, data }`. `pusher:subscription_succeeded`
and `pusher:subscription_error` become channel state and error; other `pusher:`
events stay on the native channel.

States: `unavailable` reports `connecting`, `failed` reports `disconnected`. A
channel reports `subscribing` after subscribe and again while reconnecting.

## Ably

```sh
pnpm add @priemskiyyy/simulcast-ably ably
```

```ts
import { ably } from "@priemskiyyy/simulcast-ably";

const adapter = ably({
  options: { authUrl: "/ably/token" },
  getChannelOptions: () => ({ params: { rewind: "1" } }),
});
```

Each message becomes a publication whose `event` is the message name and whose
`native` is the `InboundMessage`. State change reasons are reported as errors.

States: `disconnected` and `suspended` report `connecting`; `attaching` and
`suspended` report `subscribing`; `detached` and `failed` report `unsubscribed`.

## Supabase Realtime

```sh
pnpm add @priemskiyyy/simulcast-supabase @supabase/realtime-js
```

```ts
import { supabase } from "@priemskiyyy/simulcast-supabase";

const adapter = supabase({
  url: "wss://project.supabase.co/realtime/v1",
  options: {
    params: { apikey: SUPABASE_ANON_KEY },
    accessToken: getAccessToken,
  },
  getChannelOptions: () => ({ config: { private: true } }),
});
```

A channel is a topic and every broadcast on it is a publication with the
broadcast event as `event`. Postgres changes and presence stay on the native
channel.

States: `SUBSCRIBED` reports `subscribed`; `CHANNEL_ERROR` and `TIMED_OUT`
report `subscribing`, because realtime-js keeps rejoining. A subscription callback's
error is forwarded when the SDK supplies one. The socket reports `connecting`
after every close until dispose.

## Socket.IO

```sh
pnpm add @priemskiyyy/simulcast-socketio socket.io-client
```

```ts
import { socketio } from "@priemskiyyy/simulcast-socketio";

const adapter = socketio({
  url: "https://example.com",
  options: { auth: { token } },
});
```

A channel is an event name; rooms are joined by the server. Publications carry
the first event argument in `data` and every argument in `native`.

States: a channel is `subscribed` while the socket is connected and
`subscribing` while Socket.IO reconnects. A disconnect Socket.IO will not retry
reports `disconnected` and `unsubscribed`.

## Phoenix Channels

```sh
pnpm add @priemskiyyy/simulcast-phoenix phoenix
```

```ts
import { phoenix } from "@priemskiyyy/simulcast-phoenix";

const adapter = phoenix({
  url: "wss://example.com/socket",
  options: { params: { token } },
  getChannelParams: (channel) => ({ token: channelToken(channel) }),
});
```

A channel is a topic. Every pushed event becomes a publication; `phx_` frames do
not.

States: a join `ok` reports `subscribed`. Rejected joins report their reason as an
error and `subscribing`; timed out joins report `subscribing` without a separate
error. Phoenix keeps rejoining. The socket reports `connecting` after every close
until dispose.

## MQTT

```sh
pnpm add @priemskiyyy/simulcast-mqtt mqtt
```

```ts
import { mqtt } from "@priemskiyyy/simulcast-mqtt";

const adapter = mqtt({
  url: "wss://broker.example.com/mqtt",
  options: { username, password },
  getSubscribeOptions: () => ({ qos: 1 }),
});
```

A channel is a topic filter, including `+` and `#`. `data` is the raw payload
buffer and `native` the publish packet. This also covers brokers such as AWS IoT
Core.

States: a granted subscription reports `subscribed`; an initial subscribe failure
reports an error and `unsubscribed`. That failed filter stops receiving publications,
including messages delivered through an overlapping granted filter, and reconnecting
does not revive it. Release its consumers and subscribe again to retry. Publications
may arrive before SUBACK while the outcome is still pending, as MQTT permits.
Granted channels report `subscribing` during reconnects, or `unsubscribed` after
close when `reconnectPeriod` is `0`.

## Generic WebSocket

```sh
pnpm add @priemskiyyy/simulcast-websocket
```

```ts
import { websocket } from "@priemskiyyy/simulcast-websocket";

const adapter = websocket({
  url: () => `wss://example.com/realtime?token=${readToken()}`,
  protocol: {
    subscribe: (channel) => JSON.stringify({ type: "subscribe", channel }),
    unsubscribe: (channel) => JSON.stringify({ type: "unsubscribe", channel }),
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
});
```

For your own server: a Cloudflare Durable Object, a Hono or Bun route, anything
that multiplexes channels over one socket. You describe the frames; the adapter
reconnects after a close, resends every demanded `subscribe` frame, and routes
decoded publications. `realtime.native.get()` exposes a handle with the current `socket` and a `send` method.

States: `connecting` while reopening, with every channel `subscribing`; a
`reconnectDelay` of `0` turns a close into `disconnected` and `unsubscribed`.

## Server-Sent Events

```sh
pnpm add @priemskiyyy/simulcast-sse
```

```ts
import { sse } from "@priemskiyyy/simulcast-sse";

const adapter = sse({
  url: (channel) => `/events/${encodeURIComponent(channel)}`,
  events: ["created", "deleted"],
});
```

One `EventSource` per channel. Plain messages have no `event`; names listed in
`events` are delivered with that name, since `EventSource` has no wildcard.

States: `subscribing` until the stream opens or while the browser retries,
`unsubscribed` once it gives up.

## PartyKit

```sh
pnpm add @priemskiyyy/simulcast-partykit partysocket
```

```ts
import { partykit } from "@priemskiyyy/simulcast-partykit";

const adapter = partykit({ host: "chat.example.partykit.dev", party: "chat" });
```

For PartyKit and Cloudflare's PartyServer: a channel is a room with its own
`PartySocket`. Publications carry the raw `event.data`; parse with `useChannel`'s
`parse`.

States: `subscribing` until the room socket opens or while `partysocket`
reconnects, `subscribed` while open. The connection-level native value is `null`;
the high-level client does not expose each room's PartySocket for publishing.

## BroadcastChannel

```sh
pnpm add @priemskiyyy/simulcast-broadcast-channel
```

```ts
import { broadcastChannel } from "@priemskiyyy/simulcast-broadcast-channel";

const adapter = broadcastChannel({ prefix: "app:" });
```

Same-origin realtime between tabs, workers, and tests with no server. A channel
is a `BroadcastChannel` name and every posted message is a publication.

States: always `connected` and `subscribed`.
