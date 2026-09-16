---
description: "Build a working React realtime message list with BroadcastChannel, shared subscriptions, and optional payload validation, without a server."
---

# Getting started

Receive a message in a React application with no server, account, or credentials.
This walkthrough uses the browser's `BroadcastChannel` API. You can later select
an adapter for your backend without changing how components subscribe.

::: tip Other frameworks
Using [Vue](vue.md), [Solid](solid.md), [Svelte](svelte.md), or
[plain TypeScript](client.md)? Each has its own setup guide.
:::

## 1. Install

In an existing React 19.2 application:

::: code-group

```sh [npm]
npm install @priemskiyyy/simulcast @priemskiyyy/simulcast-react @priemskiyyy/simulcast-broadcast-channel
```

```sh [pnpm]
pnpm add @priemskiyyy/simulcast @priemskiyyy/simulcast-react @priemskiyyy/simulcast-broadcast-channel
```

```sh [yarn]
yarn add @priemskiyyy/simulcast @priemskiyyy/simulcast-react @priemskiyyy/simulcast-broadcast-channel
```

```sh [bun]
bun add @priemskiyyy/simulcast @priemskiyyy/simulcast-react @priemskiyyy/simulcast-broadcast-channel
```

:::

See [Installation](installation.md) for framework requirements and every adapter.

## 2. Create the client

```ts
// src/realtime.ts
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { broadcastChannel } from "@priemskiyyy/simulcast-broadcast-channel";

export const realtime = new RealtimeClient({
  adapter: broadcastChannel({ prefix: "demo:" }),
});

declare module "@priemskiyyy/simulcast-react" {
  interface Register {
    client: typeof realtime;
  }
}
```

The `Register` augmentation is optional. It tells every hook which adapter the
provider carries, so `useNativeConnection()` and publication handlers are typed
instead of `unknown`. Creating a client opens nothing. The provider starts a session when mounted.
Create one client per application in a browser entry point; for server rendering,
read the [request isolation guidance](server-rendering.md).

## 3. Receive and send a message

Replace your application's `App.tsx` with:

```tsx
// src/App.tsx
import type * as React from "react";
import { useState } from "react";
import {
  RealtimeProvider,
  useChannel,
  useChannelStatus,
} from "@priemskiyyy/simulcast-react";
import { realtime } from "./realtime";

type Message = { text: string };

const Room: React.FunctionComponent = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const status = useChannelStatus("rooms:demo");

  useChannel<Message>("rooms:demo", (message) => {
    setMessages((current) => [...current, message.text]);
  });

  return (
    <main>
      <h1>Room: demo</h1>
      <p>Subscription: {status.state}</p>
      <button
        type="button"
        onClick={() => {
          const publisher = new BroadcastChannel("demo:rooms:demo");
          publisher.postMessage({
            text: "Hello from another channel instance",
          });
          publisher.close();
        }}
      >
        Send a message
      </button>
      <ul>
        {messages.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
    </main>
  );
};

const App: React.FunctionComponent = () => (
  <RealtimeProvider client={realtime}>
    <Room />
  </RealtimeProvider>
);

export default App;
```

Start your application's development server and press **Send a message**. Open a
second tab at the same origin to see the same publication in both tabs. Different
ports are different origins and will not share messages.

The publisher is a separate native channel instance because BroadcastChannel does
not deliver a message back to the instance that sent it. Simulcast receives it
through the subscription created by `useChannel`.

## 4. Understand the lifecycle

| Action                                          | Result                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| Mount `RealtimeProvider`                        | Start a connection session.                         |
| Mount the first `useChannel("rooms:demo", ...)` | Create a native subscription.                       |
| Mount another consumer for the same channel     | Share the existing native subscription.             |
| Read `useChannelStatus`                         | Observe state without creating subscription demand. |
| Remove the last publication consumer            | Release the native subscription.                    |
| Unmount the provider                            | Release the session and its subscriptions.          |

## 5. Validate external payloads

The `<Message>` generic tells TypeScript what you expect. It does not validate
incoming data. For messages from a server, pass a parser such as a Zod schema:

```sh
pnpm add zod
```

```tsx
import type * as React from "react";
import { z } from "zod";
import { useChannel } from "@priemskiyyy/simulcast-react";

const MessageSchema = z.object({ text: z.string() });

const Room: React.FunctionComponent = () => {
  useChannel(
    "rooms:demo",
    (message) => {
      console.log(message.text);
    },
    { parse: MessageSchema.parse },
  );

  return null;
};
```

The parser determines the handler's payload type. The second handler argument
still contains the original publication, including `event` and `native`.
See [Errors and recovery](error-handling.md) for parser failures.

## Continue

- [Open the live demo](https://priemskiyyy.github.io/simulcast/demo/) to see shared subscriptions and devtools without installing anything.
- [Choose an adapter](adapters.md) for your server and its channel semantics.
- [Inspect subscriptions](devtools.md) in browser devtools.
- [Run the examples](examples.md) for a dashboard in each framework.
- [Define typed events](typed-events.md) when a channel carries multiple event types.
- [Manage sessions](sessions.md) when users sign in, sign out, or switch accounts.
