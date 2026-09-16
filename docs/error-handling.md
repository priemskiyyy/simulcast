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

How a provider recovers is its own business, but whether it did is on the
channel status. `useChannelStatus(channel).recovered` is `true` only when the
provider replayed the publications missed since the last subscription, so
`false` is the safe default: it covers failed recovery and providers that offer
none. Centrifugo reports it from its `subscribed` event; providers without the
concept always report `false`.

Replayed publications arrive after the status update, so a `subscribed` status
with `recovered: true` is seen before the gap is delivered. When it is `false`,
refetch from your API: see
[Refetch after a gap](recipes.md#refetch-after-a-gap).
