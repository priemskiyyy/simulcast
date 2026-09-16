# Simulcast

**Provider-independent realtime subscriptions for TypeScript.**

Simulcast owns the lifecycle of realtime subscriptions. A client holds one
connection session. Components listening to the same channel share one native
subscription, and the last one to leave releases it. The same API works from
React, Vue, Solid, Svelte, or plain TypeScript, over eleven provider adapters.

[Documentation](https://priemskiyyy.github.io/simulcast/) ·
[Get started](https://priemskiyyy.github.io/simulcast/getting-started) ·
[Live demo](https://priemskiyyy.github.io/simulcast/demo/) ·
[Adapters](https://priemskiyyy.github.io/simulcast/adapters) ·
[Devtools](https://priemskiyyy.github.io/simulcast/devtools)

## Try it without a server

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-react @priemskiyyy/simulcast-broadcast-channel
```

```tsx
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { broadcastChannel } from "@priemskiyyy/simulcast-broadcast-channel";
import { RealtimeProvider, useChannel } from "@priemskiyyy/simulcast-react";

const realtime = new RealtimeClient({
  adapter: broadcastChannel({ prefix: "app:" }),
});

const Room = () => {
  useChannel<{ text: string }>("rooms:demo", (message) => {
    console.log(message.text);
  });
  return null;
};

export const App = () => (
  <RealtimeProvider client={realtime}>
    <Room />
  </RealtimeProvider>
);
```

Swap `broadcastChannel(...)` for `centrifugo(...)` or `mqtt(...)` and the
component does not change. The full
[getting started guide](https://priemskiyyy.github.io/simulcast/getting-started)
adds a message list and a send button.

## Why Simulcast?

- **Shared subscriptions.** Components listening to the same channel use one
  native subscription. The last publication consumer releases it.
- **Explicit sessions.** Replacing a session reconnects active consumers. Cleanup
  from an old session cannot disconnect its replacement.
- **Passive observation.** Status hooks and devtools watch channels without
  creating demand.
- **Typed publications.** Infer payload types from parsers, declare event maps,
  and optionally generate named hooks.
- **Provider APIs stay accessible.** Register your client once and
  `useNativeConnection()` returns the typed native client; every publication
  carries the provider's own value.
- **One adapter contract.** Build your own with `createRealtimeAdapter` and run
  the conformance suite against it.

```text
Component A --+
Component B --+-- rooms:123 -- one native subscription
Component C --+

A unmounts  -> subscription remains
B unmounts  -> subscription remains
C unmounts  -> native subscription released
```

## What Simulcast normalizes

| Normalized                                        | Left to the provider        |
| ------------------------------------------------- | --------------------------- |
| Connection and session ownership                  | Delivery guarantees and QoS |
| Logical channels and subscription ownership       | Presence, history, RPC      |
| Shared consumers and deterministic cleanup        | Provider-specific recovery  |
| Coarse connection and channel state               | Authorization models        |
| Publication delivery with native context attached | Publishing semantics        |
| Diagnostics and devtools                          |                             |

## Frameworks and providers

| Package                                                | Purpose                                            |
| ------------------------------------------------------ | -------------------------------------------------- |
| [`@priemskiyyy/simulcast`](packages/core)              | Runtime, adapter contract, mock, conformance suite |
| [`@priemskiyyy/simulcast-react`](packages/react)       | React and React Native bindings                    |
| [`@priemskiyyy/simulcast-vue`](packages/vue)           | Vue composables                                    |
| [`@priemskiyyy/simulcast-solid`](packages/solid)       | Solid primitives                                   |
| [`@priemskiyyy/simulcast-svelte`](packages/svelte)     | Svelte utilities                                   |
| [`@priemskiyyy/simulcast-devtools`](packages/devtools) | Browser inspector and framework wrappers           |
| [`@priemskiyyy/simulcast-codegen`](packages/codegen)   | Event-hook generation from TypeScript event maps   |

| Provider           | Package                                                                           | A channel is                         |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------ |
| Centrifugo         | [`@priemskiyyy/simulcast-centrifugo`](packages/adapters/centrifugo)               | Subscription channel                 |
| Pusher Channels    | [`@priemskiyyy/simulcast-pusher`](packages/adapters/pusher)                       | Public, private, or presence channel |
| Ably               | [`@priemskiyyy/simulcast-ably`](packages/adapters/ably)                           | Realtime channel                     |
| Supabase Realtime  | [`@priemskiyyy/simulcast-supabase`](packages/adapters/supabase)                   | Broadcast topic                      |
| Socket.IO          | [`@priemskiyyy/simulcast-socketio`](packages/adapters/socketio)                   | Event name                           |
| Phoenix Channels   | [`@priemskiyyy/simulcast-phoenix`](packages/adapters/phoenix)                     | Channel topic                        |
| MQTT               | [`@priemskiyyy/simulcast-mqtt`](packages/adapters/mqtt)                           | Topic filter                         |
| PartyKit           | [`@priemskiyyy/simulcast-partykit`](packages/adapters/partykit)                   | Room                                 |
| WebSocket          | [`@priemskiyyy/simulcast-websocket`](packages/adapters/websocket)                 | Your protocol's channel identifier   |
| Server-Sent Events | [`@priemskiyyy/simulcast-sse`](packages/adapters/sse)                             | One EventSource URL                  |
| BroadcastChannel   | [`@priemskiyyy/simulcast-broadcast-channel`](packages/adapters/broadcast-channel) | Same-origin channel name             |

The [adapter comparison](https://priemskiyyy.github.io/simulcast/adapters#compare-the-adapters)
shows which adapters share a connection, who owns retries, and what
`realtime.native` exposes.

## Live demo and devtools

Open the [hosted Mission Control demo](https://priemskiyyy.github.io/simulcast/demo/),
then the Simulcast Devtools launcher. Add and remove consumers, watch listener
counts, and confirm one native subscription per channel. No backend, account, or
credentials.

![Simulcast browser devtools showing connection state, shared channels, listener counts, and the event timeline.](docs/public/images/devtools.png)

The inspector works with every binding and never creates subscription demand.
[Devtools guide](https://priemskiyyy.github.io/simulcast/devtools).

## Custom adapters

If Simulcast does not ship an adapter for your realtime system, write one with
`createRealtimeAdapter` and run `testRealtimeAdapter` from
`@priemskiyyy/simulcast/testing` against it. The
[adapter guide](https://priemskiyyy.github.io/simulcast/writing-an-adapter)
covers the contract; coding agents can load the `create-adapter` skill in
[`.claude/skills`](.claude/skills/create-adapter/SKILL.md).

## Development

Use Node 22.18 or newer and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build:docs
```

`pnpm check` builds packages and examples, checks types, lint and formatting, runs
unit and local provider tests, and validates generated hooks. See
[CONTRIBUTING.md](CONTRIBUTING.md), the
[architecture and invariants](https://priemskiyyy.github.io/simulcast/internals/architecture),
and [RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)
