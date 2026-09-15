# @priemskiyyy/simulcast

Provider-independent realtime subscriptions. `RealtimeClient` owns one connection session at a time, one shared native subscription per demanded channel, consumer fan-out, and deterministic cleanup. A `RealtimeAdapter` maps one provider SDK onto a small contract; see the [adapter guide](../../docs/adapters.md) for all eleven implementations.

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-centrifugo centrifuge
```

```ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";

const realtime = new RealtimeClient({
  adapter: centrifugo({ transport: "wss://example.com/connection/websocket" }),
});

const disconnect = realtime.connect();
const unsubscribe = realtime.channel("rooms:demo").subscribe((publication) => {
  console.log(publication.data, publication.event, publication.native);
});

unsubscribe();
disconnect();
```

Creating a client or an adapter opens nothing. `connect()` starts a session and returns its cleanup; calling it again replaces the session and moves demanded channels to the new connection. `channel(name).subscribe` creates demand for one native subscription shared by every consumer; `channel(name).status` and `connection` observe state without creating any. `native` exposes the adapter's client for provider-specific calls.

## Writing an adapter

An adapter is a cold factory. `connect(observer)` synchronously creates a fresh native client, returns ownership of it, and reports `connecting`, `connected`, or `disconnected` afterwards. `connection.subscribe(request)` is called at most once per demanded channel and returns an owned subscription that reports `subscribing`, `subscribed`, or `unsubscribed` plus publications. Both `dispose` methods are idempotent, and an adapter emits nothing once disposal starts. The core owns deduplication, stale-callback protection, and the `detached` channel state.

`createRealtimeAdapter` wraps a mapping with that bookkeeping, so an adapter only creates native resources and forwards their events. `@priemskiyyy/simulcast/mock` exports `createMockAdapter` for testing consumers without a provider SDK.

## License

[MIT](LICENSE)
