# simulcast-solid

Solid bindings for [simulcast](../core). The provider component owns the session; primitives share channel subscriptions and expose state as accessors.

```sh
pnpm add simulcast simulcast-solid
```

```tsx
import {
  RealtimeProvider,
  useChannel,
  useChannelStatus,
} from "simulcast-solid";

const Room = (props: { roomId: string }) => {
  const channel = () => `rooms:${props.roomId}`;
  const status = useChannelStatus(channel);

  useChannel<Message>(channel, (message) => console.log(message.text));

  return <p>{status().state}</p>;
};

<RealtimeProvider client={realtime} session={{ id: user().id }}>
  <Room roomId={roomId()} />
</RealtimeProvider>;
```

Channels accept a value or an accessor and resubscribe when it changes. `useChannelStatus` and `useConnectionState` return accessors, `useRealtimeClient` returns the provider's client as an accessor. Effects do not run on the server, so server rendering opens nothing and reads `disconnected` and `detached`.

| Primitive                                | Purpose                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `useChannel(channel, handler, options?)` | Receive publications; optionally parse their data. `enabled` may be an accessor. |
| `useChannelStatus(channel)`              | Observe subscription state and the latest error without opening a subscription.  |
| `useConnectionState()`                   | Read `disconnected`, `connecting`, or `connected`.                               |
| `useRealtimeClient()`                    | The provider's client as an accessor.                                            |

`createChannelEventHooks<Events>()` maps event names to channel and payload types. Providers with named events need no decoder. The package ships plain modules without JSX, so it needs no Solid compiler step.

## License

[MIT](LICENSE)
