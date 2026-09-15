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

For adapters that retry subscriptions, a transition from
`subscribing` back to `subscribed` after the first subscription means messages
may have been missed on providers without recovery:

```tsx
useChannelStatus(`rooms:${roomId}`, (status) => {
  if (status.state !== "subscribed") {
    return;
  }

  return queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
});
```

The callback fires on changes only, so the first `subscribed` also triggers one
refetch, which most rooms want anyway.

## One decoder for several channels

`createChannelEventHooks` is usually created once per application. Put the event
map next to your DTO types and export the hook from the same module that owns the
decoder, so codegen and hand-written calls share one source of truth:

```ts
export const { useChannelEvent } = createChannelEventHooks<Events>();
```

## Provider-specific calls

For shared-connection adapters, provider-specific operations stay on the native client. Reach it
through the adapter's hook, or `useRealtimeClient().native` in a
`useSyncExternalStore`, and guard against `null` while no session is active:

```tsx
const client = useCentrifuge();

const send = async (text: string) => {
  if (client === null) {
    return;
  }

  await client.publish(`rooms:${roomId}`, { text });
};
```
