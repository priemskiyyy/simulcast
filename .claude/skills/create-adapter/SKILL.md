---
name: create-adapter
description: Add a Simulcast adapter for a realtime provider. Use when asked to support a new provider, SDK, or transport in Simulcast, or to write a custom adapter in an application.
---

# Create a Simulcast adapter

An adapter translates one provider SDK onto the Simulcast contract. The core owns
deduplication, consumer fan-out, stale-callback protection, and the `detached`
state. The adapter only creates native resources and forwards their events.

## 1. Read before writing

1. `docs/writing-an-adapter.md`: the contract and rules.
2. `docs/adapters.md#compare-the-adapters`: pick the shipped adapter whose model
   is closest (shared connection vs per-channel transport, named events or not,
   who owns retries) and copy its layout from `packages/adapters/<name>`.
3. The provider SDK: its connection type, subscription or channel type, state
   enums and what each means, reconnect behavior, named-event model, message
   shape, authentication, and disposal methods.

## 2. Decide the mapping

Write these down in the package README before coding:

- What a Simulcast channel is for this provider (topic, room, event name, URL).
- Which native value `connect` returns as `native`, or `null` if none is shared.
- Which native value each subscription returns as `native`.
- The publication shape: `data`, optional `event`, and the SDK's own value as `native`.
- State maps by meaning: `connecting` and `subscribing` mean the provider keeps
  trying on its own; `disconnected` and `unsubscribed` mean it stopped.

## 3. Implement

- Package at `packages/adapters/<name>` mirroring the closest adapter: `package.json`,
  `tsconfig.json`, `tsdown.config.ts`, `README.md`, `LICENSE`, `src/index.ts`,
  `src/<name>.ts`, `src/types/<Name>AdapterOptions.ts`, and state maps in
  `src/utils/constants/connectionStates.ts` and `subscriptionStates.ts` as
  `Record`s over the provider's state union.
- Build on `createRealtimeAdapter<TNativeConnection, TNativePublication, TNativeSubscription>`.
- Grouped options such as `{ url, options, getChannelOptions }`, never flat keys.
- Local handlers named `handle*`; `typeof x === "function"` guards; no `as` casts;
  `assertUnreachable` at every union dispatch.

Do:

- Keep the factory cold: `connect` creates the native client, nothing earlier.
- Preserve native context on connections, subscriptions, and publications.
- Roll back what `subscribe` registered if the SDK throws.
- Document provider semantics in the README under `## Behavior`.

Do not:

- Change `packages/core` because one provider is unusual.
- Deduplicate or reference-count consumers; the core does that.
- Add provider fields to the generic publication type.
- Normalize QoS, presence, history, recovery, or RPC.
- Drop events silently, assume callbacks are asynchronous, or emit after dispose.

## 4. Test

1. Add `src/conformance.test.ts` calling `testRealtimeAdapter` from
   `@priemskiyyy/simulcast/testing` with a `publish` harness that makes the
   stubbed SDK deliver a message to the suite's connection. Copy the closest
   adapter's harness.
2. Add `src/<name>.test.ts` for provider semantics: a cold factory that opens
   nothing, state mapping, named events, reconnect, setup failure, and options
   passthrough. The shared suite cannot check coldness; only this test can. Construct the real SDK client
   with its connect method stubbed and drive its emitter directly.
3. Register the package in `vitest.config.ts` `adapters`, the root
   `pnpm-workspace.yaml` if needed, `docs/adapters.md` (section plus comparison
   row), `docs/installation.md`, and the README adapter table.
4. Run `pnpm build && pnpm lint:typescript && pnpm lint:eslint && pnpm lint:prettier && pnpm test:unit && pnpm test:package`.
