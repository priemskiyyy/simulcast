---
description: "Understand server snapshots, hydration, client components, and request isolation for realtime applications."
---

# Server rendering

## What happens on the server

Server rendering opens no socket. The provider's effect never runs, so hooks
render from inactive snapshots:

| Hook                 | Server value                                           |
| -------------------- | ------------------------------------------------------ |
| `useConnectionState` | `"disconnected"`                                       |
| `useChannelStatus`   | `{ state: "detached", error: null, recovered: false }` |
| `useChannel`         | nothing; the callback does not run                     |

Hydration begins from those same snapshots, so the first client render matches
the server markup. The connection starts afterwards, in an effect.

The native client is `null` on the server and during the first hydration render.
Guard against `null` before using provider methods in handlers or effects.

## React Server Components

The published bundles preserve `"use client"`, so the provider and hooks can be
imported from a server component tree without extra configuration. They still
have to be used from client components, because they are stateful and subscribe
to a socket.

## Isolate requests

A client owns mutable connection and channel state. Do not share an actively
connected client across server requests or users. Create request-specific state
where a server framework requires it, and start the browser session only after
hydration. A browser-only module-scoped client is appropriate for a single
application instance.

## React Native

See [React Native and Expo](react-native.md) for installation, application
background transitions, and the native example. Browser devtools require a DOM.
