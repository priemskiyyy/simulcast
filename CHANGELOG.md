# Changelog

## Unreleased

- **Breaking:** `@priemskiyyy/simulcast`: `ChannelStatus` carries `recovered`, telling consumers whether the provider replayed the publications missed since the last subscription. Every binding's `useChannelStatus` reports it, including the server-rendered snapshot, and `diagnostics` snapshots carry it too.
- `@priemskiyyy/simulcast`: adapters report recovery with `observer.state("subscribed", { recovered })`, typed as `AdapterSubscriptionDetail`. Omitting the detail keeps `recovered: false`, which also covers providers with no recovery to offer.
- `@priemskiyyy/simulcast-centrifugo`: reports recovery from the `subscribed` event's `wasRecovering` and `recovered`.

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
