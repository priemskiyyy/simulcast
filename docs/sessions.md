---
description: "Manage connection lifetime, account changes, token refresh callbacks, and per-consumer subscription enabling."
---

# Sessions

A session is one native connection and everything attached to it. The client
holds at most one session at a time.

## In React

```tsx
<RealtimeProvider client={realtime} session={{ id: accountId, enabled: isAuthenticated }}>
```

`session.id` decides **when the connection is replaced**. Change it and the
provider tears down the old connection and builds a new one, reattaching every
channel that still has consumers. Children stay mounted and keep their state,
which is why this is a prop rather than a React `key`.

`session.enabled` defaults to `true`. Setting it to `false` releases the session:
the connection closes, subscriptions are removed, and hooks fall back to their
inactive snapshots. Re-enabling builds a fresh session.

Passing a new `session` object every render does **not** reconnect. Only its
`id` and `enabled` values do.

## Without React

```ts
const disconnect = realtime.connect();
```

`connect()` starts a session and returns its cleanup. Calling it again replaces
the session, and demanded channels move to the new connection. The React
provider does exactly this from an effect.

## Credentials

Adapters capture their configuration when they are created, so a token callback
should read the current credentials when it runs rather than close over a value:

```ts
centrifugo({
  transport,
  options: { getToken: () => fetchConnectionToken() },
});
```

For a connection that must switch accounts, either give the callback a source of
truth that follows the signed-in user, or create one client per account and pass
the current one to the provider. Both replace the connection cleanly.

## Per-hook enabling

`session.enabled` controls the whole connection. Individual hooks take their own
`enabled` flag, which affects only that consumer:

```tsx
useChannel("rooms:demo", onMessage, { enabled: isRoomOpen });
```

When the last enabled consumer of a channel unmounts, the native subscription is
removed. Passive status observers do not hold it open.
