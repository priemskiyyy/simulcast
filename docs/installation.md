---
description: "Install Simulcast framework bindings, provider adapters, SDK peer dependencies, browser devtools, and optional hook generation."
---

# Installation

Install the core runtime, your framework binding if needed, and one adapter.
Provider SDKs are peer dependencies: install them alongside their adapters.
Packages are ESM and include TypeScript declarations.

## Frameworks

| Application                    | Packages                     | Supported peer version                   |
| ------------------------------ | ---------------------------- | ---------------------------------------- |
| Plain JavaScript or TypeScript | `simulcast`                  | No framework dependency                  |
| React                          | `simulcast simulcast-react`  | React `>=19.2 <20`                       |
| Vue                            | `simulcast simulcast-vue`    | Vue `>=3.5 <4`                           |
| Solid                          | `simulcast simulcast-solid`  | Solid `>=1.8 <2`                         |
| Svelte                         | `simulcast simulcast-svelte` | Svelte `>=5 <6`                          |
| Expo / React Native            | `simulcast simulcast-react`  | Compatible React and native provider SDK |

Use one framework binding for your application. The core does not depend on React.
For native setup, see [React Native and Expo](react-native.md).

## Adapters

Add `simulcast` alongside the packages below if it is not installed already.

| Provider           | Packages to install                        | Channel means                        |
| ------------------ | ------------------------------------------ | ------------------------------------ |
| Centrifugo         | `simulcast-centrifugo centrifuge`          | Subscription channel                 |
| Pusher Channels    | `simulcast-pusher pusher-js`               | Public, private, or presence channel |
| Ably               | `simulcast-ably ably`                      | Realtime channel                     |
| Supabase           | `simulcast-supabase @supabase/realtime-js` | Broadcast topic                      |
| Socket.IO          | `simulcast-socketio socket.io-client`      | Event name                           |
| Phoenix            | `simulcast-phoenix phoenix`                | Channel topic                        |
| MQTT               | `simulcast-mqtt mqtt`                      | Topic filter, including wildcards    |
| PartyKit           | `simulcast-partykit partysocket`           | Room                                 |
| WebSocket          | `simulcast-websocket`                      | Your protocol's channel identifier   |
| Server-Sent Events | `simulcast-sse`                            | One EventSource URL                  |
| BroadcastChannel   | `simulcast-broadcast-channel`              | Same-origin channel name             |

For example, React with Pusher:

::: code-group

```sh [npm]
npm install simulcast simulcast-react simulcast-pusher pusher-js
```

```sh [pnpm]
pnpm add simulcast simulcast-react simulcast-pusher pusher-js
```

```sh [yarn]
yarn add simulcast simulcast-react simulcast-pusher pusher-js
```

```sh [bun]
bun add simulcast simulcast-react simulcast-pusher pusher-js
```

:::

[Adapter setup](adapters.md) explains configuration and state mappings. A shared
subscription API does not make providers interchangeable at the protocol level:
channel names, authentication, payload formats, and recovery remain provider-specific.

## Optional packages

```sh
pnpm add -D simulcast-devtools simulcast-codegen typescript
```

- [Devtools](devtools.md) mounts a browser inspector. Framework wrappers are
  separate imports such as `simulcast-devtools/react`. The Svelte devtools wrapper
  requires Svelte `>=5.29 <6`, while the framework binding itself supports `>=5 <6`.
- [Code generation](codegen.md) generates framework hooks from your event map.
- [Application testing](testing.md) uses `simulcast/mock`, included in the core.

## Runtime requirements

WebSocket, SSE, and BroadcastChannel adapters use runtime APIs. Browser availability
and native SDK support depend on the environment you target. Node-based SSE clients
need an EventSource implementation; the SSE adapter accepts it through its options.
Do not mount the DOM-based devtools in React Native.

Developing this repository requires Node 22.18 or newer and the pnpm version in
`package.json`. That tooling requirement is separate from the published runtime's
framework peer requirements.
