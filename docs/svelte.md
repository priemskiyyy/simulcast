---
description: "Use Simulcast providers, reactive channel inputs, typed event utilities, and browser devtools in Svelte 5."
---

# Svelte

`@priemskiyyy/simulcast-svelte` mirrors the React bindings with Svelte 5 idioms: a provider
component owns the session, utilities return reactive values read through
`current`, and channels accept values or getters. Everything is built on runes,
so the package needs Svelte 5.

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-svelte
```

## Provider

```svelte
<script lang="ts">
  import { RealtimeProvider } from "@priemskiyyy/simulcast-svelte";
  import { realtime } from "./realtime/client";
  import Room from "./Room.svelte";

  let { user, roomId } = $props();
</script>

<RealtimeProvider client={realtime} session={{ id: user.id }}>
  <Room {roomId} />
</RealtimeProvider>
```

`session.id` and `session.enabled` behave as in React: changing the ID replaces
the connection and disabling releases it. Both are derived by value, so a new
object with the same values does nothing. Effects do not run on the server, so
server rendering opens nothing.

## Utilities

```svelte
<script lang="ts">
  import {
    useChannel,
    useChannelStatus,
    useConnectionState,
  } from "@priemskiyyy/simulcast-svelte";

  let { roomId }: { roomId: string } = $props();

  const connection = useConnectionState();
  const status = useChannelStatus(() => `rooms:${roomId}`);

  useChannel<Message>(
    () => `rooms:${roomId}`,
    (message) => console.log(message.text),
    { parse: MessageSchema.parse },
  );
</script>

<p>{connection.current} · {status.current.state}</p>
```

| Utility                                  | Returns                         | Opens a subscription |
| ---------------------------------------- | ------------------------------- | -------------------- |
| `useChannel(channel, handler, options?)` | nothing                         | yes                  |
| `useChannelStatus(channel)`              | `ReadableBox<ChannelStatus>`    | no                   |
| `useConnectionState()`                   | `ReadableBox<ConnectionState>`  | no                   |
| `useNativeConnection()`                  | `ReadableBox<TNative \| null>`  | no                   |
| `useRealtimeClient()`                    | `ReadableBox<RegisteredClient>` | no                   |

Every `channel` argument is a value or a getter. A getter resubscribes when its
value changes; a plain string is fixed for the component's lifetime.
`options.enabled` may also be a getter. Call utilities during component
initialisation, as with `getContext`. The returned values are read through
`current` in templates, `$derived`, and `$effect`, the same shape as
`MediaQuery` in `svelte/reactivity`.

There is no `onChange` argument: read the value in an effect.

```ts
$effect(() => {
  if (status.current.state === "unsubscribed") {
    report(status.current.error);
  }
});
```

`useNativeConnection()` mirrors the provider's native adapter connection into
a box that reads `null` on the server and while no session is active. Its
type is `unknown` until the client is registered:

```ts
// src/realtime.ts
export const realtime = new RealtimeClient({
  adapter: centrifugo({ transport }),
});

declare module "@priemskiyyy/simulcast-svelte" {
  interface Register {
    client: typeof realtime;
  }
}
```

```ts
const centrifuge = useNativeConnection(); // ReadableBox<Centrifuge | null>
```

Registering also types `useRealtimeClient()` and the `native` field of every
publication handler. Nothing changes at runtime. The augmentation is program-wide, so
it assumes one client per application; see the
[React notes](hooks.md#type-the-client-once) for several clients and libraries.

## Typed events

```ts
// src/realtime/useChannelEvent.ts
import { createChannelEventHooks } from "@priemskiyyy/simulcast-svelte";
import type { Events } from "./Events";

export const { useChannelEvent } = createChannelEventHooks<Events>();
```

`useChannelEvent` accepts the same channel inputs as `useChannel`. The matching
lives in core, so React, Vue, Solid, and Svelte behave identically. See
[Typed events](typed-events.md) for the event map and decoders.

## Code generation

Set `"runtime": "@priemskiyyy/simulcast-svelte"` in `realtime.config.json` and generated hooks
import their types from the Svelte package. Their channel parameter accepts a
getter through `ChannelInput`.

## Devtools

`@priemskiyyy/simulcast-devtools/svelte` exports `createDevtools`, an attachment for an element
inside a child of the provider. Call it during that child's initialization so the
provider context already exists.

```svelte [Inspector.svelte]
<script lang="ts">
  import { createDevtools } from "@priemskiyyy/simulcast-devtools/svelte";

  const devtools = createDevtools();
</script>

<div {@attach devtools}></div>
```

Render `<Inspector />` beneath `RealtimeProvider`, guarded by your application's
development flag. See the [complete mounting example](devtools.md#mount-it).
