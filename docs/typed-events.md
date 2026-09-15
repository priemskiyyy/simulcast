---
description: "Define channel event maps and decoders, infer payload types, and validate incoming publications with parsers."
---

# Typed events

Use `createChannelEventHooks` when a channel carries several event types. You
define the event map and decode your publication format.

## Declare the map

Each event names the channels it can arrive on and the payload it carries.

```ts
// src/realtime/Events.ts
export type Message = { id: string; text: string };

export type Events = {
  "message.created": {
    channel: `rooms:${string}`;
    payload: Message;
  };
  "presence.changed": {
    channel: `rooms:${string}`;
    payload: { online: number };
  };
};
```

The `channel` type is enforced at the call site, so `useChannelEvent("billing", "message.created", ...)`
is a compile error.

## Create the hook

Providers with named events, such as Pusher, Ably, Supabase, Socket.IO, and
Phoenix, put the name on `publication.event`. No decoder is needed:

```ts
// src/realtime/useChannelEvent.ts
import { createChannelEventHooks } from "simulcast-react";
import type { Events } from "./Events";

export const { useChannelEvent } = createChannelEventHooks<Events>();
```

## Write a decoder

Centrifugo publications have no event name, so an envelope inside an already
decoded JSON payload can carry it instead. A decoder receives the whole publication and
returns an event name and payload, or `null` to ignore it:

```ts
export const { useChannelEvent } = createChannelEventHooks<Events>({
  decode: ({ data }) => {
    if (typeof data !== "object" || data === null) {
      return null;
    }

    if (!("name" in data) || typeof data.name !== "string") {
      return null;
    }

    if (!("body" in data)) {
      return null;
    }

    return { eventType: data.name, payload: data.body };
  },
});
```

MQTT also has no event name, but its data is a Buffer, not a decoded object. Decode
its bytes to text and parse JSON before inspecting the envelope; see
[Payload parsing](parsing.md). Returning `null` from the event decoder ignores that
publication for this consumer.

The decoder runs for each consumer receiving a publication, before event
matching. Use a hook's `parse` option to validate matching payloads.

## Use it

```tsx
useChannelEvent("rooms:demo", "message.created", (message) => {
  console.log(message.text);
});
```

`message` is `Message`, taken from the map. A hook's `parse` runs only for
matching events and must return that event's declared payload type.

Every `useChannelEvent` call goes through `useChannel`, so listeners for different
events on the same channel share one native subscription.

## Turn the map into named hooks

The map holds enough information to write the hooks for you:

```tsx
// instead of
useChannelEvent("rooms:demo", "message.created", onMessage);

// generate once, then call
useMessageCreated("rooms:demo", onMessage);
```

```sh
pnpm exec simulcast-codegen generate
```

[Code generation](codegen.md) covers configuration, the `check` and `watch`
commands, naming overrides, and what the event map must look like.
