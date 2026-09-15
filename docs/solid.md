---
description: "Use Simulcast providers, accessors, and typed realtime subscription primitives in Solid applications."
---

# Solid

`simulcast-solid` mirrors the React bindings with Solid idioms: a provider
component owns the session, primitives return accessors, and channels accept
values or accessors. The package ships plain modules without JSX, so it needs no
Solid compiler step.

```sh
pnpm add simulcast simulcast-solid
```

## Provider

```tsx
import { RealtimeProvider } from "simulcast-solid";
import { realtime } from "./realtime/client";

const Application = () => (
  <RealtimeProvider client={realtime} session={{ id: user().id }}>
    <Room roomId={roomId()} />
  </RealtimeProvider>
);
```

`session.id` and `session.enabled` behave as in React: changing the ID replaces
the connection and disabling releases it. Both are memoized by value, so a new
object with the same values does nothing. Effects do not run on the server, so
server rendering opens nothing.

## Primitives

```tsx
import {
  useChannel,
  useChannelStatus,
  useConnectionState,
} from "simulcast-solid";

const Room = (props: { roomId: string }) => {
  const channel = () => `rooms:${props.roomId}`;
  const connection = useConnectionState();
  const status = useChannelStatus(channel);

  useChannel<Message>(channel, (message) => console.log(message.text), {
    parse: MessageSchema.parse,
  });

  return (
    <p>
      {connection()} · {status().state}
    </p>
  );
};
```

| Primitive                                | Returns                     | Opens a subscription |
| ---------------------------------------- | --------------------------- | -------------------- |
| `useChannel(channel, handler, options?)` | nothing                     | yes                  |
| `useChannelStatus(channel)`              | `Accessor<ChannelStatus>`   | no                   |
| `useConnectionState()`                   | `Accessor<ConnectionState>` | no                   |
| `useRealtimeClient()`                    | `Accessor<RealtimeClient>`  | no                   |

Every `channel` argument is a value or an `Accessor<string>`. An accessor
resubscribes when its value changes; a plain string is fixed for the owner's
lifetime. `options.enabled` may also be an accessor. Callbacks are plain
functions, so they never need wrapping.

There is no `onChange` argument: track the accessor in an effect.

```ts
createEffect(() => {
  if (status().state === "unsubscribed") {
    report(status().error);
  }
});
```

## Typed events

```ts
// src/realtime/useChannelEvent.ts
import { createChannelEventHooks } from "simulcast-solid";
import type { Events } from "./Events";

export const { useChannelEvent } = createChannelEventHooks<Events>();
```

`useChannelEvent` accepts the same channel inputs as `useChannel`. The matching
lives in core, so React, Vue, Solid, and Svelte behave identically. See
[Typed events](typed-events.md) for the event map and decoders.

## Code generation

Set `"runtime": "simulcast-solid"` in `realtime.config.json` and generated hooks
import their types from the Solid package. Their channel parameter accepts an
accessor through `ChannelInput`.

## Devtools

`simulcast-devtools/solid` exports the same inspector as the React package.
Render it inside the provider; see [Devtools](devtools.md).

```tsx
import { SimulcastDevtools } from "simulcast-devtools/solid";

<RealtimeProvider client={realtime}>
  <App />
  {import.meta.env.DEV ? <SimulcastDevtools /> : null}
</RealtimeProvider>;
```
