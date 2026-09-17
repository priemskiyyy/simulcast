---
description: "Use the framework-independent RealtimeClient to own sessions, share channel subscriptions, observe state, and inspect diagnostics."
---

# Client

`RealtimeClient` is the framework-independent core. It owns one session at a
time, one logical channel per name, and the native subscription each channel
demands.

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";

const realtime = new RealtimeClient({ adapter });
```

| Member          | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `connect()`     | Starts a session and returns its cleanup. Calling it again replaces it.    |
| `channel(name)` | Returns a logical channel handle. Creates nothing until used.              |
| `connection`    | `{ get, subscribe }` over `"disconnected" \| "connecting" \| "connected"`. |
| `native`        | `{ get, subscribe }` over the adapter's native client, or `null`.          |
| `diagnostics`   | Snapshots and events for devtools and custom integrations.                 |

## Channels

```ts
const channel = realtime.channel("rooms:demo");

const unsubscribe = channel.subscribe((publication) => {
  console.log(publication.data, publication.event, publication.native);
});

channel.status.get(); // Current state depends on the session and provider.
```

`subscribe` creates demand: the first consumer opens one native subscription and
the last one closes it. Every consumer receives every publication, in
registration order. A consumer that throws or rejects is reported in a microtask
and does not stop its siblings.

`status` observes without creating demand. A channel nobody subscribed to reports
`detached`. Its `error` holds the adapter's last error until the channel
subscribes successfully.

## Observable values

`connection`, `native`, and every `status` share one shape:

```ts
type ObservableValue<T> = {
  get: () => T;
  subscribe: (listener: () => void) => () => void;
};
```

`subscribe` notifies after changes and never replays the current value. This is
the shape React's `useSyncExternalStore` expects.

## Diagnostics

`diagnostics.get()` returns a snapshot of the adapter name, session, connection
state, and every channel with consumers. `diagnostics.subscribe()` reports snapshot changes,
batched per microtask. `diagnostics.events.subscribe()` receives every adapter
state, error, and publication plus the runtime's own lifecycle events, each with
a `source` of `connection`, `channel`, or `runtime`. Observers never create or
retain subscriptions.

## Native access depends on the adapter

`realtime.channel(name).native` observes the adapter's native subscription for
one channel. It reads `null` until a publication consumer demands the channel,
and returns to `null` when the last one leaves, so observing it never opens a
subscription.

`realtime.native.get()` exposes a shared native client for adapters such as
Centrifugo, Pusher, and Ably. It returns `null` for adapters with independent
per-channel resources: PartyKit, SSE, and BroadcastChannel. Their high-level
channel handles expose `subscribe` and `status`, not a native room socket or
EventSource. A publication's `native` is the event context, not a shared client.
