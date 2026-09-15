---
description: "Diagnose detached channels, missing messages, duplicate development sessions, token changes, native access, and devtools setup."
---

# Troubleshooting

Start with connection state, then channel state, then the publication itself.
[Devtools](devtools.md) makes these visible without creating new subscriptions.

## A channel stays detached

`useChannelStatus` observes a channel but does not subscribe. Mount an enabled
`useChannel` consumer for the exact same name and ensure the provider has an
active session. A disabled session also leaves demanded channels detached.

## Connected, but no messages arrive

`connected` describes the adapter's connection, not necessarily every channel.
SSE, PartyKit, and BroadcastChannel report an active session as connected and
track delivery state per channel.

Check:

- The channel reaches `subscribed` and has publication listeners.
- The server publishes to the same channel identifier.
- Your parser accepts the payload and your event decoder recognizes the event.
- The adapter's channel semantics match the server. Socket.IO channels are event
  names, MQTT channels are filters, and Supabase publications are broadcasts.
- With SSE, every named event you want appears in the adapter's `events` option.
- With BroadcastChannel, tabs share the same origin and configured prefix.

A subscription becoming ready does not generate a publication by itself.

## I see duplicate connections in development

React Strict Mode runs an extra effect setup and cleanup cycle in development.
A short session start, end, and start sequence is expected. After the cycle,
there should be one active session for a client.

Create the client once rather than on every component render. Avoid mounting
multiple providers that each try to own the same client. Use the diagnostics
timeline to distinguish consecutive sessions from simultaneous native connections.

## Messages were missed while disconnected

Simulcast does not persist or replay publications. Recovery depends on the
provider and server configuration. Refetch authoritative state when a channel
resubscribes, or inspect native recovery metadata when your provider exposes it.
See [Recipes](recipes.md#refetch-after-a-gap).

## An error boundary did not catch a handler error

Publication handlers run outside React rendering. Parser errors, synchronous
handler throws, and rejected handler promises are isolated from other consumers
and then reported through a microtask. React error boundaries do not catch them.
Handle an expected failure in your callback or parser. See
[Errors and recovery](error-handling.md) for error ownership.

## Changing the token did not replace the connection

Adapters retain the configuration supplied at creation. Use the SDK's token
callback to read current credentials, and change `session.id` when the account
identity changes. A fresh `session` object with the same `id` and `enabled` does
not reconnect. See [Sessions](sessions.md).

## The native client is null

There is no active native client before the provider's effect starts, after
session disposal, or during server rendering. Typed adapter hooks also return
`null` if the current adapter does not match. Guard it before calling native APIs.
BroadcastChannel has no shared native connection, so its connection-level native
value is always `null`.

## Devtools does not open

Mount its framework wrapper beneath the provider. In Svelte, call
`createDevtools` during initialization of a child component beneath the provider;
a provider rendered later in the same component cannot provide context upwards.
The inspector needs a browser DOM and cannot mount inside a native app.

## The Expo app cannot reach localhost

On a physical phone, `localhost` is the phone. Use the computer's LAN address,
keep both devices reachable on the same network, and check the server's origin
and transport configuration. See the
[Expo networking notes](react-native.md#connect-to-a-server).
