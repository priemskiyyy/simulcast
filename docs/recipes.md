---
description: "Integrate realtime subscriptions with query invalidation, cache updates, recovery refetches, event decoders, and native provider methods."
---

# Recipes

## Refresh a query when a publication arrives

Realtime events say that something changed; the query owns the data. Invalidate
on publication and let TanStack Query refetch:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useChannel } from "@priemskiyyy/simulcast-react";

const useRoomInvalidation = (roomId: string) => {
  const queryClient = useQueryClient();

  useChannel(`rooms:${roomId}`, () => {
    return queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
  });
};
```

Returning the promise lets simulcast report a failed invalidation the same way
it reports any handler failure. Publications keep flowing while it runs.

## Append to a cached list

When the publication carries the full record, update the cache directly and
skip the round trip:

```tsx
useChannel<Message>(
  `rooms:${roomId}`,
  (message) => {
    queryClient.setQueryData<Message[]>(
      ["rooms", roomId, "messages"],
      (current) => (current === undefined ? current : [...current, message]),
    );
  },
  { parse: MessageSchema.parse },
);
```

Parse at the boundary so a malformed publication never reaches the cache.

## Refetch after a gap

A subscription that returns to `subscribed` may have missed publications while
it was away. `recovered` tells you whether the provider replayed them, so a
refetch only runs when there is a gap left to fill:

```tsx
useChannelStatus(`rooms:${roomId}`, (status) => {
  if (status.state !== "subscribed" || status.recovered) {
    return;
  }

  return queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
});
```

The callback fires on changes only, so the first `subscribed` also triggers one
refetch, which most rooms want anyway. Providers without recovery report
`recovered: false` throughout, which refetches after every reconnect.

## One decoder for several channels

`createChannelEventHooks` is usually created once per application. Put the event
map next to your DTO types and export the hook from the same module that owns the
decoder, so codegen and hand-written calls share one source of truth:

```ts
export const { useChannelEvent } = createChannelEventHooks<Events>();
```

## Migrate between providers

Two clients can run side by side. Each provider owns its own session, and hooks
resolve the nearest one, so a component belongs to exactly one client:

```tsx
<RealtimeProvider client={pusherRealtime}>
  <LegacyFeature />
  <RealtimeProvider client={centrifugoRealtime}>
    <MigratedFeature />
  </RealtimeProvider>
</RealtimeProvider>
```

`MigratedFeature` and everything below it use Centrifugo; `LegacyFeature` keeps
Pusher. Move features into the inner tree one at a time. A component cannot use
both clients through hooks, so reach the other one imperatively with
`client.channel(name).subscribe(...)` if one component needs both.

If the application [registers its client](hooks.md#type-the-client-once), name
both while the migration runs:

```ts
declare module "@priemskiyyy/simulcast-react" {
  interface Register {
    client: typeof pusherRealtime | typeof centrifugoRealtime;
  }
}
```

`useNativeConnection()` then returns `Pusher | Centrifuge | null`, so narrow it
before a provider-specific call:

```ts
const native = useNativeConnection();

if (native instanceof Centrifuge) {
  await native.publish("rooms:demo", { text });
}
```

Drop the old client from the registration once the migration finishes. Every
provider still holding it fails to compile, which turns the last step into a
compile-time checklist.

## Provider-specific calls

For shared-connection adapters, provider-specific operations stay on the native client. Reach it
through `useNativeConnection()`, typed once you [register the client](hooks.md#type-the-client-once),
and guard against `null` while no session is active:

```tsx
const client = useNativeConnection(); // Centrifuge | null

const send = async (text: string) => {
  if (client === null) {
    return;
  }

  await client.publish(`rooms:${roomId}`, { text });
};
```
