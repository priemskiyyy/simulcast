---
description: "Understand subscription errors, isolated handler failures, reconnect behavior, and recovery of missed realtime publications."
---

# Errors and recovery

## Where failures surface

**Missing provider.** Any hook used outside a `RealtimeProvider` throws during
render, so a React error boundary catches it.

**Your callbacks.** Parsers and handlers are yours, and reporting their failures
is too. A synchronous throw or a rejected promise from one consumer is isolated:
siblings still receive the publication, and the adapter's delivery keeps running.
The failure is then thrown in a microtask. In a browser it reaches the global
`error` event; in Node it is an uncaught exception unless the application handles it. Because event callbacks run outside React rendering, **error boundaries do
not catch them**.

**Subscription errors.** A channel that fails to subscribe reports it through
`useChannelStatus(channel).error`, holding the provider's own error value. It
stays set until the channel subscribes successfully.

**Connection errors.** These have no generic outlet besides
[diagnostics](client.md#diagnostics) and the native client. Use the adapter's
native escape hatch for provider-specific handling.

**Adapter setup failures.** If an adapter throws while creating a connection or
subscription, the runtime rolls back what it acquired, leaves the channel
`detached`, and rethrows to the caller.

## Reconnects

Provider SDKs own reconnecting; the generic WebSocket adapter implements its own
retry loop. Shared-connection adapters report `connecting` during retry attempts.
Per-channel transports such as SSE and PartyKit keep the session `connected` and
report recovery through channel state. Retry behavior and terminal failures follow
the selected provider and configuration. A rejected subscription is not guaranteed
to recover merely because its connection reconnects.

The runtime never stores publications and guarantees no delivery. It is a
lifecycle and ownership layer, not a cache.

## Recovering missed publications

Recovery, history, and rewind are provider features and stay on the native
client. With Centrifugo, the `subscribed` event on the native subscription
reports `wasRecovering` and `recovered`; when recovery fails, refetch from your
API.
