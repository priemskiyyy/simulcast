---
title: Simulcast
titleTemplate: Provider-independent realtime subscriptions for TypeScript
description: Provider-independent realtime subscriptions for TypeScript. One lifecycle model for connections and shared channel subscriptions across Centrifugo, Pusher, Ably, MQTT, WebSocket, SSE, and more, with React, Vue, Solid, and Svelte bindings.
---

<script setup>
// The demo is a separate application, not a page of this site, so these links
// leave the router rather than being handled by it.
import { withBase } from "vitepress";
</script>

# Simulcast

**Provider-independent realtime subscriptions for TypeScript.**

Simulcast owns the lifecycle of realtime subscriptions. A client holds one
connection session. Components listening to the same channel share one native
subscription, and the last one to leave releases it. The same API works from
React, Vue, Solid, Svelte, or plain TypeScript, over eleven provider adapters.

[Get started](getting-started.md) · <a :href="withBase('/demo/')" target="_blank" rel="noreferrer">Live demo</a> ·
[Adapters](adapters.md) · [Devtools](devtools.md) ·
[GitHub](https://github.com/priemskiyyy/simulcast)

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-react @priemskiyyy/simulcast-broadcast-channel
```

## One lifecycle, any provider

The consumer code does not change when the adapter does.

::: code-group

```ts [realtime.ts (MQTT)]
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { mqtt } from "@priemskiyyy/simulcast-mqtt";

export const realtime = new RealtimeClient({
  adapter: mqtt({ url: "wss://broker.example.com/mqtt" }),
});
```

```ts [realtime.ts (Centrifugo)]
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";

export const realtime = new RealtimeClient({
  adapter: centrifugo({ transport: "wss://example.com/connection/websocket" }),
});
```

```tsx [Room.tsx (React)]
import { useChannel } from "@priemskiyyy/simulcast-react";

export const Room = () => {
  useChannel("rooms:demo", (message) => console.log(message));
  return null;
};
```

:::

What ports here is the lifecycle. An MQTT channel is a topic filter and a
Centrifugo channel is a subscription, and Simulcast owns only when each one is
created and released.

## Consumers share one native subscription

```text
Component A --+
Component B --+-- rooms:123 -- one native subscription
Component C --+

A unmounts  -> subscription remains
B unmounts  -> subscription remains
C unmounts  -> native subscription released
```

Status observers such as `useChannelStatus` watch a channel without creating
demand, so a badge or devtools panel never keeps a subscription alive.

## What Simulcast normalizes

| Normalized                                  | Left to the provider                   |
| ------------------------------------------- | -------------------------------------- |
| Connection and session ownership            | Delivery guarantees and QoS            |
| Logical channels and subscription ownership | Presence and history                   |
| Shared consumers and deterministic cleanup  | RPC, history, and how recovery happens |
| Coarse connection and channel state         | Authorization models                   |
| Publication delivery with native context    | Publishing semantics                   |
| Diagnostics and devtools                    |                                        |

```text
React / Vue / Solid / Svelte / TypeScript
                    |
                    v
          Simulcast core -- Devtools
                    |
        +-----------+-----------+
        |           |           |
    Centrifugo     MQTT       Pusher   ...
```

## Why not use the provider SDK directly?

You still do. Simulcast never replaces `Centrifuge`, `Pusher`, or `mqtt.js`. It
decides when their connections and subscriptions are created and released, and
leaves the rest to them. What it adds:

- Subscriptions that follow a component's lifecycle.
- One native subscription per channel, however many components listen.
- Cleanup that is deterministic and idempotent.
- Consumer code that survives a change of provider or framework.
- Diagnostics and devtools that read the same way across providers.
- A mock adapter for tests, and one contract for writing new adapters.

Presence, history, QoS, RPC, and publishing stay on the native client, which
every hook can reach.

## When not to use Simulcast

- One subscription, listened to in one place. The SDK alone is less code.
- Provider-specific features in every component. There is no portability left to
  gain.
- A need for uniform delivery guarantees or presence across providers. Simulcast
  does not normalize those.
- No component lifecycle to integrate with. A subscription map you write
  yourself is enough.

[Choose an adapter](adapters.md) · [Write your own](writing-an-adapter.md) ·
<a :href="withBase('/demo/')" target="_blank" rel="noreferrer">Open the live demo</a> · [Read the architecture](internals/architecture.md)
