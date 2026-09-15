---
description: "Implement the Simulcast adapter contract with explicit resource ownership, state mapping, publication forwarding, and reliable cleanup."
---

# Writing an adapter

An adapter maps one provider SDK onto a small contract. The runtime owns
deduplication, consumer fan-out, stale-callback protection, and the `detached`
channel state. The adapter creates native resources and forwards their events.

## The contract

```ts
type RealtimeAdapter<TNativeConnection, TNativePublication, TNativeSubscription> = {
  name: string;
  connect: (observer: AdapterConnectionObserver) => AdapterConnection<...>;
};

type AdapterConnection<...> = {
  native: TNativeConnection;
  subscribe: (request: AdapterSubscribeRequest<TNativePublication>) => AdapterSubscription<TNativeSubscription>;
  dispose: () => void;
};

type AdapterSubscribeRequest<TNativePublication> = {
  channel: string;
  observer: AdapterSubscriptionObserver<TNativePublication>;
};

type AdapterSubscription<TNativeSubscription> = {
  native: TNativeSubscription;
  dispose: () => void;
};
```

Observers take `state`, `error`, and for subscriptions `publication`. None of
their methods are optional: a provider without an explicit state callback has the
adapter emit state during setup and cleanup.

## Rules

- **Cold factory.** Creating an adapter opens nothing. `connect` synchronously
  creates a fresh native client, returns ownership of it, and reports progress
  through the observer afterwards. Providers that connect inside their
  constructor fit this; providers that connect asynchronously report the
  transition when it happens.
- **One subscription per demanded channel.** The runtime calls `subscribe` at
  most once per channel on a connection. Never deduplicate in the adapter.
- **Map states by meaning.** `connecting` and `subscribing` mean the provider
  keeps trying on its own; `disconnected` and `unsubscribed` mean it stopped.
  Keep the map in `utils/constants/connectionStates.ts` as a `Record` over the
  provider's state union so a new provider state fails compilation.
- **Silent after dispose.** Once `dispose()` starts, the adapter emits nothing.
  Do not report `unsubscribed` on dispose; the runtime reports `detached`.
- **Preserve the native context.** Publications carry the provider's own value
  in `native` and its event name in `event` when it has one.
- **Roll back on failure.** If the SDK throws during subscribe, remove what was
  registered before rethrowing so the channel can be retried.

## createRealtimeAdapter

`createRealtimeAdapter` from `simulcast` adds the bookkeeping every adapter
needs: idempotent disposal, subscriptions released with their connection,
observers silenced after dispose, and a thrown error for `subscribe` on a
disposed connection. Explicit generics are required, since the publication type
cannot be inferred from how a callback parameter is used.

```ts
import { createRealtimeAdapter } from "simulcast";

export const provider = (options: ProviderOptions) =>
  createRealtimeAdapter<Client, Message, Channel>({
    name: "provider",
    connect: (observer) => {
      const client = new Client(options);
      const onState = (state: ProviderState) =>
        observer.state(CONNECTION_STATES[state]);
      client.on("state", onState);

      return {
        native: client,
        subscribe: ({ channel: name, observer }) => {
          const channel = client.channel(name);
          const onMessage = (message: Message) =>
            observer.publication({
              event: message.name,
              data: message.data,
              native: message,
            });
          channel.on("message", onMessage);
          observer.state("subscribing");

          return {
            native: channel,
            dispose: () => {
              channel.off("message", onMessage);
              channel.leave();
            },
          };
        },
        dispose: () => {
          client.off("state", onState);
          client.close();
        },
      };
    },
  });
```

The three shipped adapters are the reference implementations. Centrifugo maps
one to one, Pusher synthesizes channel state from protocol events, and Ably maps
seven channel states onto three.

## Testing

`simulcast/mock` exports `createMockAdapter`, a deliberately unguarded adapter
that records every call and exposes raw observers, so consumer tests can drive
late, duplicate, synchronous, and reentrant callbacks. Adapter tests should
construct the real SDK client with its connect method stubbed and drive its
emitter directly, as the shipped adapters do.
