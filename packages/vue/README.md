# @priemskiyyy/simulcast-vue

Vue bindings for [simulcast](../core). The provider component owns the session; composables share channel subscriptions and expose state as refs.

```sh
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-vue
```

```vue
<script setup lang="ts">
import { useChannel, useChannelStatus } from "@priemskiyyy/simulcast-vue";

const props = defineProps<{ roomId: string }>();
type Message = { id: string; text: string };

const status = useChannelStatus(() => `rooms:${props.roomId}`);

useChannel<Message>(
  () => `rooms:${props.roomId}`,
  (message) => {
    console.log(message.text);
  },
);
</script>

<template>
  <p>{{ status.state }}</p>
</template>
```

```vue
<RealtimeProvider :client="realtime" :session="{ id: currentUser.id }">
  <Room :room-id="roomId" />
</RealtimeProvider>
```

Channels accept a value, a ref, or a getter and resubscribe when they change. `useChannelStatus` and `useConnectionState` return readonly shallow refs. `useRealtimeClient` returns the provider's client as a ref, including `native` for provider-specific APIs. Subscriptions start after mount, so server rendering opens nothing and hydrates from `disconnected` and `detached`.

| Composable                               | Purpose                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `useChannel(channel, handler, options?)` | Receive publications; optionally parse their data. `enabled` may be a ref.      |
| `useChannelStatus(channel)`              | Observe subscription state and the latest error without opening a subscription. |
| `useConnectionState()`                   | Read `disconnected`, `connecting`, or `connected`.                              |
| `useRealtimeClient()`                    | The provider's client as a ref.                                                 |

`createChannelEventHooks<Events>()` maps event names to channel and payload types. Providers with named events need no decoder.

## License

[MIT](LICENSE)
