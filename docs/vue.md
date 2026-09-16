---
description: "Use Simulcast providers, Vue composables, reactive channel inputs, and typed event maps in Vue 3.5 applications."
---

# Vue

`@priemskiyyy/simulcast-vue` mirrors the React bindings with Vue idioms: a provider component
owns the session, composables return refs, and channels accept refs or getters.

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-vue
```

Requires Vue 3.5 or newer.

## Provider

```vue
<script setup lang="ts">
import { RealtimeProvider } from "@priemskiyyy/simulcast-vue";
import { realtime } from "./realtime/client";
</script>

<template>
  <RealtimeProvider :client="realtime" :session="{ id: currentUser.id }">
    <Room :room-id="roomId" />
  </RealtimeProvider>
</template>
```

`session.id` and `session.enabled` behave as in React: changing the ID replaces
the connection and disabling releases it, while a new object with the same values
does nothing. Connecting happens after mount, so server rendering opens nothing.

## Composables

```vue
<script setup lang="ts">
import {
  useChannel,
  useChannelStatus,
  useConnectionState,
} from "@priemskiyyy/simulcast-vue";

const props = defineProps<{ roomId: string }>();
const channel = () => `rooms:${props.roomId}`;

const connection = useConnectionState();
const status = useChannelStatus(channel);

useChannel<Message>(channel, (message) => console.log(message.text), {
  parse: MessageSchema.parse,
});
</script>

<template>
  <p>{{ connection }} · {{ status.state }}</p>
</template>
```

| Composable                               | Returns                                 | Opens a subscription |
| ---------------------------------------- | --------------------------------------- | -------------------- |
| `useChannel(channel, handler, options?)` | nothing                                 | yes                  |
| `useChannelStatus(channel)`              | `Readonly<ShallowRef<ChannelStatus>>`   | no                   |
| `useConnectionState()`                   | `Readonly<ShallowRef<ConnectionState>>` | no                   |
| `useNativeConnection()`                  | `Readonly<ShallowRef<TNative \| null>>` | no                   |
| `useRealtimeClient()`                    | `Ref<RegisteredClient>`                 | no                   |

Every `channel` argument is a `MaybeRefOrGetter<string>`. A ref or getter
resubscribes when its value changes; a plain string is fixed for the component's
lifetime. `options.enabled` may also be a ref or getter. Callbacks are plain
functions captured at setup, so they never need wrapping.

There is no `onChange` argument: watch the returned ref.

```ts
watch(status, ({ state, error }) => {
  if (state === "unsubscribed") {
    report(error);
  }
});
```

`useNativeConnection()` mirrors the provider's native adapter connection into
a ref that reads `null` on the server and while no session is active. Its
type is `unknown` until the client is registered:

```ts
// src/realtime.ts
export const realtime = new RealtimeClient({
  adapter: centrifugo({ transport }),
});

declare module "@priemskiyyy/simulcast-vue" {
  interface Register {
    client: typeof realtime;
  }
}
```

```ts
const centrifuge = useNativeConnection(); // Readonly<ShallowRef<Centrifuge | null>>
```

Registering also types `useRealtimeClient()` and the `native` field of every
publication handler. Nothing changes at runtime. The augmentation is program-wide, so
it assumes one client per application; see the
[React notes](hooks.md#type-the-client-once) for several clients and libraries.

## Typed events

```ts
// src/realtime/useChannelEvent.ts
import { createChannelEventHooks } from "@priemskiyyy/simulcast-vue";
import type { Events } from "./Events";

export const { useChannelEvent } = createChannelEventHooks<Events>();
```

`useChannelEvent` accepts the same channel inputs as `useChannel`. See
[Typed events](typed-events.md) for the event map and decoders; the matching
itself lives in core, so React, Vue, Solid, and Svelte behave identically.

## Code generation

Set `"runtime": "@priemskiyyy/simulcast-vue"` in `realtime.config.json` and generated hooks
import their types from the Vue package. Their channel parameter accepts a ref or
getter through `ChannelInput`.

## Devtools

`@priemskiyyy/simulcast-devtools/vue` exports the same inspector as the React package. Render
it inside the provider; see [Devtools](devtools.md).

```vue
<script setup lang="ts">
import { SimulcastDevtools } from "@priemskiyyy/simulcast-devtools/vue";
</script>

<template>
  <RealtimeProvider :client="realtime">
    <App />
    <SimulcastDevtools v-if="isDevelopment" />
  </RealtimeProvider>
</template>
```
