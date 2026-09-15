# Changelog

## simulcast 0.1.0 - 2026-09-16

- Provider-independent realtime runtime: one connection session at a time, one shared native subscription per demanded channel, consumer fan-out, and deterministic cleanup.
- Adapter contract with `createRealtimeAdapter` for idempotent disposal, owned-subscription teardown, and silence after dispose.
- `createChannelEventMatcher` so every framework binding shares one typed-event implementation.
- Passive diagnostics for connection, channel, and runtime events.
- `simulcast/mock` adapter for testing consumers without a provider SDK.

## simulcast-react 0.1.0 - 2026-09-16

- `RealtimeProvider` owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks` with a publication-aware decoder.
- SSR and hydration support with StrictMode lifecycle coverage.

## simulcast-vue 0.1.0 - 2026-09-16

- `RealtimeProvider` component owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks`, all accepting refs or getters for channels.
- Subscriptions start after mount so server rendering opens nothing.

## simulcast-solid 0.1.0 - 2026-09-16

- `RealtimeProvider` component owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks`, all accepting accessors for channels.
- Plain modules without JSX, so no Solid compiler step is required.
- Channel and `enabled` inputs are memoized by value, so equal values never resubscribe.

## simulcast-svelte 0.1.0 - 2026-09-16

- `RealtimeProvider` component owning the session, with `session.id` replacement and `session.enabled`.
- `useChannel`, `useChannelStatus`, `useConnectionState`, `useRealtimeClient`, and `createChannelEventHooks` built on runes, accepting getters for channels and exposing state through `current`.
- Effects do not run on the server, so server rendering opens nothing.

## simulcast-centrifugo 0.1.0 - 2026-09-16

- Centrifugo adapter with per-channel subscription options and `useCentrifuge()` for the native client.

## simulcast-pusher 0.1.0 - 2026-09-16

- Pusher Channels adapter mapping named events to publications and protocol events to channel state.
- Reentrant disposal cancels connection work started during SDK notifications. Synchronous custom authorization callbacks report errors after channel listeners attach.

## simulcast-ably 0.1.0 - 2026-09-16

- Ably adapter mapping message names to publications and channel states by their retry semantics.

## simulcast-supabase 0.1.0 - 2026-09-16

- Supabase Realtime adapter mapping broadcasts to publications and join statuses to channel state.

## simulcast-socketio 0.1.0 - 2026-09-16

- Socket.IO adapter treating event names as channels and mirroring the socket's reconnection state.

## simulcast-phoenix 0.1.0 - 2026-09-16

- Phoenix Channels adapter mapping topics to channels, join replies to channel state, and every pushed event to a publication.

## simulcast-mqtt 0.1.0 - 2026-09-16

- MQTT adapter on mqtt.js with topic-filter routing, grant handling, and reconnect-aware channel state.

## simulcast-websocket 0.1.0 - 2026-09-16

- Generic WebSocket adapter with a subscribe, unsubscribe, and decode protocol, reconnection with resubscribe, and a native send handle.

## simulcast-sse 0.1.0 - 2026-09-16

- Server-Sent Events adapter with one EventSource per channel and named event delivery.

## simulcast-partykit 0.1.0 - 2026-09-16

- PartyKit and PartyServer adapter with one PartySocket per room.

## simulcast-broadcast-channel 0.1.0 - 2026-09-16

- BroadcastChannel adapter for same-origin tabs, workers, and tests.

## simulcast-devtools 0.1.0 - 2026-09-16

- Framework-independent core: `new SimulcastDevtools({ client })` with `mount`, `unmount`, `setClient`, and `setMaxEvents`, rendered into a shadow root so host styles never leak.
- Wrappers for every binding: `simulcast-devtools/react`, `/vue`, `/solid`, and a `createDevtools` attachment under `/svelte`.
- Inspector for connection state, channel status, listener counts, and a bounded event timeline for any adapter, with kind chips, search, pause, clear, and payload capture.
- Docks to the bottom or the right edge, resizes by drag or arrow keys, and remembers its open state and size across reloads.

## simulcast-codegen 0.1.0 - 2026-09-16

- Generate named React hooks from a TypeScript event map for `simulcast-react`, with drift checks and a watcher.
