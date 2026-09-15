---
description: "Use Simulcast providers, Vue composables, reactive channel inputs, and typed event maps in Vue 3.5 applications."
---

# Vue

`simulcast-vue` mirrors the React bindings with Vue idioms: a provider component
owns the session, composables return refs, and channels accept refs or getters.

```sh
pnpm add simulcast simulcast-vue
```

Requires Vue 3.5 or newer.

## Provider

```vue
<script setup lang="ts">
import { RealtimeProvider } from "simulcast-vue";
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
} from "simulcast-vue";

const props = defineProps<{ roomId: string }>();
const channel = () => `rooms:${props.roomId}`;

const connection = useConnectionState();
const status = useChannelStatus(channel);

useChannel<Message>(channel, (message) => console.log(message.text), {
  parse: messageSchema.parse,
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
| `useRealtimeClient()`                    | `Ref<RealtimeClient>`                   | no                   |

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

## Typed events

```ts
// src/realtime/useChannelEvent.ts
import { createChannelEventHooks } from "simulcast-vue";
import type { Events } from "./Events";

export const { useChannelEvent } = createChannelEventHooks<Events>();
```

`useChannelEvent` accepts the same channel inputs as `useChannel`. See
[Typed events](typed-events.md) for the event map and decoders; the matching
itself lives in core, so React, Vue, Solid, and Svelte behave identically.

## Code generation

Set `"runtime": "simulcast-vue"` in `realtime.config.json` and generated hooks
import their types from the Vue package. Their channel parameter accepts a ref or
getter through `ChannelInput`.

## Devtools

`simulcast-devtools/vue` exports the same inspector as the React package. Render
it inside the provider; see [Devtools](devtools.md).

```vue
<script setup lang="ts">
import { SimulcastDevtools } from "simulcast-devtools/vue";
</script>

<template>
  <RealtimeProvider :client="realtime">
    <App />
    <SimulcastDevtools v-if="isDevelopment" />
  </RealtimeProvider>
</template>
```
