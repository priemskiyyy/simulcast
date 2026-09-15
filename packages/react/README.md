# simulcast-react

React bindings for [simulcast](../core). The provider owns the session; hooks share channel subscriptions and observe state.

```sh
pnpm add simulcast simulcast-react
```

```tsx
import type * as React from "react";
import { RealtimeClient } from "simulcast";
import { RealtimeProvider, useChannel } from "simulcast-react";

const realtime = new RealtimeClient({ adapter });

type Message = { id: string; text: string };

const Room: React.FunctionComponent = () => {
  useChannel<Message>("rooms:demo", (message) => {
    console.log(message.text);
  });

  return null;
};

export const Application: React.FunctionComponent = () => {
  return (
    <RealtimeProvider client={realtime} session={{ id: "current-user" }}>
      <Room />
    </RealtimeProvider>
  );
};
```

Changing `session.id` replaces the connection and reattaches active subscriptions. Setting `session.enabled` to `false` releases it. Hooks are SSR-safe and return `disconnected` and `detached` snapshots on the server.

| Hook                                     | Purpose                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `useChannel(channel, handler, options?)` | Receive publications; optionally parse their data.                              |
| `useChannelStatus(channel, onChange?)`   | Observe subscription state and the latest error without opening a subscription. |
| `useConnectionState(onChange?)`          | Read `disconnected`, `connecting`, or `connected`.                              |
| `useRealtimeClient()`                    | Access the provider's client, including `native` for provider-specific APIs.    |

`createChannelEventHooks` maps event names to channel and payload types. Its `decode` callback receives the whole publication, so providers with named events can return `publication.event` directly.

## Guides

- [Complete credential-free quickstart](../../docs/getting-started.md)
- [React hook reference](../../docs/hooks.md)
- [React Native and Expo](../../docs/react-native.md)
- [Errors and recovery](../../docs/error-handling.md)

## License

[MIT](LICENSE)
