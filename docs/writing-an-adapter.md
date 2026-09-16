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

`createRealtimeAdapter` from `@priemskiyyy/simulcast` adds the bookkeeping every adapter
needs: idempotent disposal, subscriptions released with their connection,
observers silenced after dispose, and a thrown error for `subscribe` on a
disposed connection. Explicit generics are required, since the publication type
cannot be inferred from how a callback parameter is used.

```ts
import { createRealtimeAdapter } from "@priemskiyyy/simulcast";

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

The eleven shipped adapters are the reference implementations. Centrifugo maps
one to one, Pusher synthesizes channel state from protocol events, Ably maps
seven channel states onto three, and SSE, PartyKit, and BroadcastChannel carry
all state on their channels because they have no shared connection. Start from
the one whose model is closest to your provider; the
[comparison table](adapters.md#compare-the-adapters) shows which that is.

## Conformance tests

`@priemskiyyy/simulcast/testing` exports `testRealtimeAdapter`, a Vitest suite
that checks the parts of the contract every adapter must satisfy: connections and
subscriptions that dispose idempotently, `subscribe` rejected after disposal,
publications delivered with their native context, channels kept apart, silence
after disposal, and contract state strings reported to both observers. Call it
once from a `conformance.test.ts`:

```ts
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { provider } from "src/provider";

testRealtimeAdapter({
  name: "provider",
  createAdapter: () => provider({ url: "wss://example.test" }),
  // Make the stubbed SDK deliver `data` on `channel` to this connection.
  publish: (connection, channel, data) => {
    connection.native.emit("message", { channel, data });
  },
});
```

`publish` drives the provider side of a connection the suite created, stubbing
the SDK the same way the adapter's own tests do. Pass `channels` when the
provider constrains channel names. Provider-specific behavior such as payload
decoding, reconnect mapping, and per-channel options stays in the adapter's own
tests; every shipped adapter carries a `conformance.test.ts` to copy from. A cold
factory cannot be checked generically, since only the provider knows what opening
a resource looks like, so keep that assertion in the adapter's own tests as the
shipped adapters do.

## Testing consumers

`@priemskiyyy/simulcast/mock` exports `createMockAdapter`, a deliberately unguarded adapter
that records every call and exposes raw observers, so consumer tests can drive
late, duplicate, synchronous, and reentrant callbacks. Adapter tests should
construct the real SDK client with its connect method stubbed and drive its
emitter directly, as the shipped adapters do.

## Build one with a coding agent

The repository ships a `create-adapter` skill in
`.claude/skills/create-adapter/SKILL.md`, and an `AGENTS.md` that points agents
at this guide, at the closest shipped adapter, and at the conformance suite. An
agent follows the same route a person does: read the provider's SDK, copy the
adapter whose model is closest, implement the mapping, then make both test
suites pass.
