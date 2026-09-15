---
description: "Reference for React realtime hooks: receive publications, observe channel and connection state, and access typed native clients."
---

# Hooks

Every hook requires a `RealtimeProvider` above it and throws an error if one is
missing.

| Hook                                        | Returns           | Opens a subscription |
| ------------------------------------------- | ----------------- | -------------------- |
| [`useChannel`](#usechannel)                 | nothing           | yes                  |
| [`useChannelStatus`](#usechannelstatus)     | `ChannelStatus`   | no                   |
| [`useConnectionState`](#useconnectionstate) | `ConnectionState` | no                   |
| [`useRealtimeClient`](#userealtimeclient)   | `RealtimeClient`  | no                   |

Callbacks always see current render values without recreating the subscription,
so you never need to memoise them. They may be async, but publications are not
queued behind their completion.

## useChannel

```ts
useChannel<TData = unknown>(
  channel: string,
  onEvent: PublicationHandler<TData>,
  options?: { enabled?: boolean; parse?: (data: unknown) => TData },
): void
```

Subscribes to a channel and receives its publications.

```tsx
useChannel("rooms:demo", (message, publication) => {
  console.log(message, publication.event);
});
```

The handler's second argument is the `RealtimePublication`: `data`, the optional
provider `event` name, and `native`, the provider's own context.

`parse` runs on every publication and its return type drives inference. Pass it
by reference (`schema.parse`, `Number`) or annotate a parameter on either side:
TypeScript cannot infer the payload from an inline `(raw) => ...` arrow when the
handler's parameter is also unannotated, and falls back to `unknown`. The
explicit generic declares your wire contract instead, and nothing validates it
at runtime. Supplying both requires them to agree.

## useChannelStatus

```ts
useChannelStatus(
  channel: string,
  onChange?: (status: ChannelStatus) => void | Promise<unknown>,
): ChannelStatus
```

```ts
type ChannelStatus = {
  state: "detached" | "unsubscribed" | "subscribing" | "subscribed";
  error: { error: unknown } | null;
};
```

Observing a channel's status does **not** subscribe to it. `detached` means there
is no active native subscription. This happens when no enabled publication
consumer demands the channel, or when the client has no active session, even if
consumers are registered. `unsubscribed` instead describes a native subscription
that reports it has stopped. If a channel stays `detached`, check both its enabled
`useChannel` consumers and the provider's session.

`error.error` is the provider's own error value. The optional callback fires on
changes after registration; it never replays the current value.

## useConnectionState

```ts
useConnectionState(
  onChange?: (state: ConnectionState) => void | Promise<unknown>,
): "disconnected" | "connecting" | "connected"
```

The connection state, or `disconnected` when no session is active. `connecting`
includes reconnect attempts the provider makes on its own.

## useRealtimeClient

```ts
useRealtimeClient(): RealtimeClient
```

The provider's client. Use `native` for provider-specific calls, and
`diagnostics` for custom inspection:

```tsx
const realtime = useRealtimeClient();
const client = useSyncExternalStore(
  realtime.native.subscribe,
  realtime.native.get,
  () => null,
);
```

Adapter packages ship typed shortcuts for this. `useCentrifuge()` from
`@priemskiyyy/simulcast-centrifugo/react` returns `Centrifuge | null` and narrows at runtime,
so it also returns `null` when a different adapter is in use.

## createChannelEventHooks

```ts
const { useChannelEvent } = createChannelEventHooks<Events>({ decode });
```

Builds a hook typed by your event map. See [Typed events](typed-events.md).
