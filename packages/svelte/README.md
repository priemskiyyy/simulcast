# simulcast-svelte

Svelte 5 bindings for [simulcast](../core). The provider component owns the session; rune-based utilities share channel subscriptions and expose state through `current`.

```sh
pnpm add simulcast simulcast-svelte
```

```svelte
<script lang="ts">
  import { useChannel, useChannelStatus } from "simulcast-svelte";

  let { roomId }: { roomId: string } = $props();

  const status = useChannelStatus(() => `rooms:${roomId}`);

  useChannel<Message>(
    () => `rooms:${roomId}`,
    (message) => console.log(message.text),
  );
</script>

<p>{status.current.state}</p>
```

```svelte
<RealtimeProvider client={realtime} session={{ id: user.id }}>
  <Room {roomId} />
</RealtimeProvider>
```

Channels accept a value or a getter and resubscribe when it changes. `useChannelStatus` and `useConnectionState` return values read through `current`, and so does `useRealtimeClient` for the provider's client. Effects do not run on the server, so server rendering opens nothing and reads `disconnected` and `detached`.

| Utility                                  | Purpose                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `useChannel(channel, handler, options?)` | Receive publications; optionally parse their data. `enabled` may be a getter.   |
| `useChannelStatus(channel)`              | Observe subscription state and the latest error without opening a subscription. |
| `useConnectionState()`                   | Read `disconnected`, `connecting`, or `connected`.                              |
| `useRealtimeClient()`                    | The provider's client, read through `current`.                                  |

`createChannelEventHooks<Events>()` maps event names to channel and payload types. Providers with named events need no decoder. The package is built with `svelte-package`, so it ships the provider as a `.svelte` component and the utilities as rune modules.

## License

[MIT](LICENSE)
