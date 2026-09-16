---
description: "Reference for React realtime hooks: receive publications, observe channel and connection state, and access typed native clients."
---

# Hooks

Every hook requires a `RealtimeProvider` above it and throws an error if one is
missing.

| Hook                                          | Returns            | Opens a subscription |
| --------------------------------------------- | ------------------ | -------------------- |
| [`useChannel`](#usechannel)                   | nothing            | yes                  |
| [`useChannelStatus`](#usechannelstatus)       | `ChannelStatus`    | no                   |
| [`useConnectionState`](#useconnectionstate)   | `ConnectionState`  | no                   |
| [`useNativeConnection`](#usenativeconnection) | `TNative \| null`  | no                   |
| [`useRealtimeClient`](#userealtimeclient)     | `RegisteredClient` | no                   |

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
  recovered: boolean;
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

`recovered` answers whether the provider replayed the publications missed since
the last subscription, and only `subscribed` can report `true`. Read it as
"assume a gap unless told otherwise": `false` covers a provider that recovered
nothing, one whose recovery failed, and one with no recovery to offer. See
[Refetch after a gap](recipes.md#refetch-after-a-gap).

## useConnectionState

```ts
useConnectionState(
  onChange?: (state: ConnectionState) => void | Promise<unknown>,
): "disconnected" | "connecting" | "connected"
```

The connection state, or `disconnected` when no session is active. `connecting`
includes reconnect attempts the provider makes on its own.

## useNativeConnection

```ts
useNativeConnection(): TNative | null
```

The provider's native adapter connection, or `null` during server rendering and
while no session is active. The component rerenders when a session replaces or
releases it. The type is `unknown` until you [register the client](#type-the-client-once);
then it follows the adapter:

```tsx
const centrifuge = useNativeConnection(); // Centrifuge | null once registered
```

## Type the client once

Every hook reads the client from the provider, so TypeScript cannot know which
adapter it carries. Augment `Register` next to the client to tell it:

```ts
// src/realtime.ts
export const realtime = new RealtimeClient({
  adapter: centrifugo({ transport }),
});

declare module "@priemskiyyy/simulcast-react" {
  interface Register {
    client: typeof realtime;
  }
}
```

From then on `useNativeConnection()` returns `Centrifuge | null`,
`useRealtimeClient()` is `typeof realtime`, and every `useChannel` handler
receives the adapter's publication type in `native`. Nothing changes at runtime,
and an application that skips the augmentation keeps `unknown`. TanStack Router
types its hooks the same way.

A registration that does not name a `RealtimeClient`, such as the factory
function instead of its return type, falls back to the unregistered types
instead of failing. The hooks then return `unknown` with nothing pointing at the
cause. Each example guards against that with a one-line compile-time check in
`src/realtime/register.ts`.

The augmentation covers the whole TypeScript program, so it assumes one client
per application, as the rest of Simulcast does. An application
[migrating between providers](recipes.md#migrate-between-providers) can register
a union of both. A shared component library should not register at all, and
keeps `unknown`.

## useRealtimeClient

```ts
useRealtimeClient(): RealtimeClient
```

The provider's client. Use `channel` and `native` for imperative access, and
`diagnostics` for custom inspection.

## createChannelEventHooks

```ts
const { useChannelEvent } = createChannelEventHooks<Events>({ decode });
```

Builds a hook typed by your event map. See [Typed events](typed-events.md).
