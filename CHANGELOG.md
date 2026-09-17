# Changelog

## @priemskiyyy/simulcast 0.4.0 - 2026-09-17

- A channel handle exposes `native`, the adapter's subscription for that channel, or `null` while none exists. Observing it registers as a passive consumer, so it never creates demand.
- **Breaking:** `RealtimeClient` carries the adapter's subscription type as a third type argument. A mock standing in for a registered adapter now takes three type arguments.
- `createRealtimeAdapter` releases a subscription that arrives after its connection was disposed and stops forwarding its events. A provider reporting state synchronously from `subscribe` could otherwise leave a native subscription alive and still delivering publications.
- `@priemskiyyy/simulcast/testing` covers that sequence, so every adapter is held to it.

## @priemskiyyy/simulcast-react 0.4.0 - 2026-09-17

- `useNativeChannel(channel)` mirrors a channel's native subscription, typed by the registered client through the new `RegisteredNativeSubscription`.
- `useChannelDemand(channel, options?)` holds a channel's subscription open without consuming publications, for a component that watches the native subscription instead.
- The `Register` aliases infer every position of the registered client, so the runtime's new subscription type does not make them fall back to `unknown`.
- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-vue 0.4.0 - 2026-09-17

- `useNativeChannel(channel)` mirrors a channel's native subscription, typed by the registered client through the new `RegisteredNativeSubscription`.
- `useChannelDemand(channel, options?)` holds a channel's subscription open without consuming publications, for a component that watches the native subscription instead.
- The `Register` aliases infer every position of the registered client, so the runtime's new subscription type does not make them fall back to `unknown`.
- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-solid 0.4.0 - 2026-09-17

- `useNativeChannel(channel)` mirrors a channel's native subscription, typed by the registered client through the new `RegisteredNativeSubscription`.
- `useChannelDemand(channel, options?)` holds a channel's subscription open without consuming publications, for a component that watches the native subscription instead.
- The `Register` aliases infer every position of the registered client, so the runtime's new subscription type does not make them fall back to `unknown`.
- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-svelte 0.4.0 - 2026-09-17

- `useNativeChannel(channel)` mirrors a channel's native subscription, typed by the registered client through the new `RegisteredNativeSubscription`.
- `useChannelDemand(channel, options?)` holds a channel's subscription open without consuming publications, for a component that watches the native subscription instead.
- The `Register` aliases infer every position of the registered client, so the runtime's new subscription type does not make them fall back to `unknown`.
- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-centrifugo 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-pusher 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-ably 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-supabase 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-socketio 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-phoenix 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-mqtt 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-websocket 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-sse 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-partykit 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-broadcast-channel 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4.

## @priemskiyyy/simulcast-devtools 0.4.0 - 2026-09-17

- Requires `@priemskiyyy/simulcast` 0.4 and the matching 0.4 framework bindings.

## @priemskiyyy/simulcast-codegen 0.4.0 - 2026-09-17

- Published with the 0.4.0 version line. No changes to the generator or its output.

## @priemskiyyy/simulcast 0.3.0 - 2026-09-16

- **Breaking:** `ChannelStatus` carries `recovered`, telling consumers whether the provider replayed the publications missed since the last subscription. `false` is the safe default: it covers failed recovery and providers with none to offer. Diagnostics snapshots carry it per channel.
- Adapters report it with `observer.state("subscribed", { recovered })`, typed as the new `AdapterSubscriptionDetail`. Omitting the detail keeps `recovered: false`, so adapters without the concept need no change.

## @priemskiyyy/simulcast-react 0.3.0 - 2026-09-16

- `useChannelStatus` reports `recovered`, including the server-rendered snapshot.
- Requires `@priemskiyyy/simulcast` 0.3.

## @priemskiyyy/simulcast-vue 0.3.0 - 2026-09-16

- `useChannelStatus` reports `recovered`, including the server-rendered snapshot.
- Requires `@priemskiyyy/simulcast` 0.3.

## @priemskiyyy/simulcast-solid 0.3.0 - 2026-09-16

- `useChannelStatus` reports `recovered`, including the server-rendered snapshot.
- Requires `@priemskiyyy/simulcast` 0.3.

## @priemskiyyy/simulcast-svelte 0.3.0 - 2026-09-16

- `useChannelStatus` reports `recovered`, including the server-rendered snapshot.
- Requires `@priemskiyyy/simulcast` 0.3.

## @priemskiyyy/simulcast-centrifugo 0.3.0 - 2026-09-16

- Reports recovery on `ChannelStatus.recovered`, read from the `subscribed` event's `wasRecovering` and `recovered`. Centrifugo emits it after `state` and before the replayed publications, so the status is correct by the time the gap arrives.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-pusher 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-ably 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-supabase 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-socketio 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-phoenix 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-mqtt 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-websocket 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-sse 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-partykit 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-broadcast-channel 0.3.0 - 2026-09-16

- Reports no recovery, so `ChannelStatus.recovered` stays `false` and consumers refetch after a gap.
- Requires `@priemskiyyy/simulcast` 0.3 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-devtools 0.3.0 - 2026-09-16

- Channel snapshots carry `recovered`.
- Requires `@priemskiyyy/simulcast` 0.3 and the matching 0.3 framework bindings.

## @priemskiyyy/simulcast-codegen 0.3.0 - 2026-09-16

- Published with the 0.3.0 version line. No changes to the generator or its output.

## @priemskiyyy/simulcast 0.2.0 - 2026-09-16

- `@priemskiyyy/simulcast/testing` exports `testRealtimeAdapter`, a Vitest conformance suite for the adapter contract. `vitest` is an optional peer dependency used only by that entry.
- `createMockAdapter` takes optional native type arguments, so a mock client satisfies an application that registered a real adapter.

## @priemskiyyy/simulcast-react 0.2.0 - 2026-09-16

- `Register` types every hook with the application's client through one module augmentation. `useRealtimeClient`, the publication argument of `useChannel`, and the new `useNativeConnection()` follow the registered adapter; applications that skip it keep `unknown`.
- Requires `@priemskiyyy/simulcast` 0.2.

## @priemskiyyy/simulcast-vue 0.2.0 - 2026-09-16

- `Register` types every composable with the application's client, including the new `useNativeConnection()`.
- Requires `@priemskiyyy/simulcast` 0.2.

## @priemskiyyy/simulcast-solid 0.2.0 - 2026-09-16

- `Register` types every primitive with the application's client, including the new `useNativeConnection()`.
- Requires `@priemskiyyy/simulcast` 0.2.

## @priemskiyyy/simulcast-svelte 0.2.0 - 2026-09-16

- `Register` types every utility with the application's client, including the new `useNativeConnection()`.
- Requires `@priemskiyyy/simulcast` 0.2.

## @priemskiyyy/simulcast-centrifugo 0.2.0 - 2026-09-16

- **Breaking:** removed `useCentrifuge()` and the `/react` entry, along with the optional `react` and `@priemskiyyy/simulcast-react` peers. Register the client and call `useNativeConnection()` from any binding instead.
- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-pusher 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-ably 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-supabase 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-socketio 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-phoenix 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-mqtt 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-websocket 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-sse 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-partykit 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-broadcast-channel 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and runs the shared adapter conformance suite.

## @priemskiyyy/simulcast-devtools 0.2.0 - 2026-09-16

- Requires `@priemskiyyy/simulcast` 0.2 and the matching 0.2 framework bindings.

## @priemskiyyy/simulcast-codegen 0.2.0 - 2026-09-16

- Published with the 0.2.0 version line. No changes to the generator or its output.

## @priemskiyyy/simulcast 0.1.0 - 2026-09-16

- Provider-independent realtime runtime: one connection session at a time, one shared native subscription per demanded channel, consumer fan-out, and deterministic cleanup.
- Adapter contract with `createRealtimeAdapter` for idempotent disposal, owned-subscription teardown, and silence after dispose.
- `createChannelEventMatcher` so every framework binding shares one typed-event implementation.
- Passive diagnostics for connection, channel, and runtime events.
- `@priemskiyyy/simulcast/mock` adapter for testing consumers without a provider SDK.

## @priemskiyyy/simulcast-react 0.1.0 - 2026-09-16

- `RealtimeProvider` owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks` with a publication-aware decoder.
- SSR and hydration support with StrictMode lifecycle coverage.

## @priemskiyyy/simulcast-vue 0.1.0 - 2026-09-16

- `RealtimeProvider` component owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks`, all accepting refs or getters for channels.
- Subscriptions start after mount so server rendering opens nothing.

## @priemskiyyy/simulcast-solid 0.1.0 - 2026-09-16

- `RealtimeProvider` component owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks`, all accepting accessors for channels.
- Plain modules without JSX, so no Solid compiler step is required.
- Channel and `enabled` inputs are memoized by value, so equal values never resubscribe.

## @priemskiyyy/simulcast-svelte 0.1.0 - 2026-09-16

- `RealtimeProvider` component owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks` built on runes, accepting getters for channels and exposing state through `current`.
- Effects do not run on the server, so server rendering opens nothing.

## @priemskiyyy/simulcast-centrifugo 0.1.0 - 2026-09-16

- Centrifugo adapter with per-channel subscription options and `useCentrifuge()` for the native client.

## @priemskiyyy/simulcast-pusher 0.1.0 - 2026-09-16

- Pusher Channels adapter mapping named events to publications and protocol events to channel state.
- Reentrant disposal cancels connection work started during SDK notifications. Synchronous custom authorization callbacks report errors after channel listeners attach.

## @priemskiyyy/simulcast-ably 0.1.0 - 2026-09-16

- Ably adapter mapping message names to publications and channel states by their retry semantics.

## @priemskiyyy/simulcast-supabase 0.1.0 - 2026-09-16

- Supabase Realtime adapter mapping broadcasts to publications and join statuses to channel state.

## @priemskiyyy/simulcast-socketio 0.1.0 - 2026-09-16

- Socket.IO adapter treating event names as channels and mirroring the socket's reconnection state.

## @priemskiyyy/simulcast-phoenix 0.1.0 - 2026-09-16

- Phoenix Channels adapter mapping topics to channels, join replies to channel state, and every pushed event to a publication.

## @priemskiyyy/simulcast-mqtt 0.1.0 - 2026-09-16

- MQTT adapter on mqtt.js with topic-filter routing, grant handling, and reconnect-aware channel state.

## @priemskiyyy/simulcast-websocket 0.1.0 - 2026-09-16

- Generic WebSocket adapter with a subscribe, unsubscribe, and decode protocol, reconnection with resubscribe, and a native send handle.

## @priemskiyyy/simulcast-sse 0.1.0 - 2026-09-16

- Server-Sent Events adapter with one EventSource per channel and named event delivery.

## @priemskiyyy/simulcast-partykit 0.1.0 - 2026-09-16

- PartyKit and PartyServer adapter with one PartySocket per room.

## @priemskiyyy/simulcast-broadcast-channel 0.1.0 - 2026-09-16

- BroadcastChannel adapter for same-origin tabs, workers, and tests.

## @priemskiyyy/simulcast-devtools 0.1.0 - 2026-09-16

- Framework-independent core: `new SimulcastDevtools({ client })` with `mount`, `unmount`, `setClient`, and `setMaxEvents`, rendered into a shadow root so host styles never leak.
- Wrappers for every binding: `@priemskiyyy/simulcast-devtools/react`, `/vue`, `/solid`, and a `createDevtools` attachment under `/svelte`.
- Inspector for connection state, channel status, listener counts, and a bounded event timeline for any adapter, with kind chips, search, pause, clear, and payload capture.
- Docks to the bottom or the right edge, resizes by drag or arrow keys, and remembers its open state and size across reloads.

## @priemskiyyy/simulcast-codegen 0.1.0 - 2026-09-16

- Generate named React hooks from a TypeScript event map for `@priemskiyyy/simulcast-react`, with drift checks and a watcher.
