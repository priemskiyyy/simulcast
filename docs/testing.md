---
description: "Test realtime consumers deterministically with the mock adapter, including publication delivery, state changes, and cleanup."
---

# Testing

Application code that uses simulcast can be tested without any provider SDK.
`@priemskiyyy/simulcast/mock` exports a deterministic adapter that records every connection
and subscription and exposes their observers, so a test can publish, change
state, or fail exactly when it wants to.

```sh
pnpm add -D @priemskiyyy/simulcast
```

## Registered applications

If your application [registers its client](hooks.md#type-the-client-once), the
provider only accepts that client's type. Give the mock the same native types
and it stands in for the real adapter:

```ts
import type { Centrifuge, PublicationContext, Subscription } from "centrifuge";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";

const { adapter, connections } = createMockAdapter<
  Centrifuge,
  PublicationContext,
  Subscription
>();
```

The three arguments are the adapter's native connection, publication, and
subscription types, in the order `RealtimeClient` carries them.

The recorded connections and observers keep their own mock types, so tests still
emit `native: null`. Applications that do not register need no type arguments.

## A component test

```tsx
import type * as React from "react";
import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import { RealtimeProvider, useChannel } from "@priemskiyyy/simulcast-react";

const Room: React.FunctionComponent = () => {
  const [text, setText] = useState("Waiting");
  useChannel<{ text: string }>("rooms:demo", (message) =>
    setText(message.text),
  );
  return <p>{text}</p>;
};

test("renders a publication and releases the subscription on unmount", () => {
  const { adapter, connections } = createMockAdapter();
  const realtime = new RealtimeClient({ adapter });
  const { unmount } = render(
    <RealtimeProvider client={realtime}>
      <Room />
    </RealtimeProvider>,
  );

  const connection = connections[0];
  const subscription = connection?.subscriptions[0];
  if (connection === undefined || subscription === undefined) {
    throw new Error("Expected the mounted room to create a subscription");
  }

  act(() => {
    subscription.observer.publication({
      data: { text: "hello" },
      native: null,
    });
  });
  expect(screen.getByText("hello").textContent).toBe("hello");

  unmount();
  expect(subscription.disposeCount).toBe(1);
  expect(connection.disposeCount).toBe(1);
});
```

Use a DOM test environment such as Vitest's `jsdom` and install React Testing
Library for this example. An explicit guard fails the test if setup never creates
a subscription; an optional observer call could silently skip the behavior under test.

`connections` lists every session the client opened, in order, and each
connection lists every native subscription the runtime asked for. Their
`observer` fields are the callbacks the runtime handed to the adapter, so calling
them is exactly what a provider would do.

## Driving state

```ts
subscription.observer.state("subscribing");
subscription.observer.state("subscribed");
subscription.observer.error({ error: new Error("permission denied") });
connection.observer.state("connected");
```

`useChannelStatus` and `useConnectionState` update synchronously; wrap the calls
in `act()` when React is involved.

## Synchronous and failing providers

The mock takes two hooks that run inside `connect` and `subscribe`, which is how
real SDKs emit their first state before returning. Throw from a hook to model a
provider that fails while creating a resource; the runtime rolls back and the
mock records nothing.

```ts
const { adapter } = createMockAdapter({
  onConnect: (connection) => connection.observer.state("connecting"),
  onSubscribe: (subscription) => subscription.observer.state("subscribing"),
});
```

## Cleanup assertions

Every recorded connection and subscription carries a `disposeCount`, so tests
can assert that unmounting released exactly what it created:

```ts
unmount();
expect(connections[0]?.disposeCount).toBe(1);
expect(connections[0]?.subscriptions.every((s) => s.disposeCount === 1)).toBe(
  true,
);
```

The mock is deliberately not well behaved: it never guards its observers, so a
test can also emit after disposal and prove the application ignores it.

## Choose the right test layer

| Layer                           | Use it to verify                                                   | Limit                                                     |
| ------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| Mock adapter                    | UI updates, parsing, event routing, cleanup, and late callbacks    | Does not verify an SDK or network protocol                |
| Real SDK with controlled events | Provider state mapping and SDK lifecycle behavior                  | Does not verify a real server                             |
| Local server integration        | Authentication, network delivery, reconnects, and resource cleanup | A compatible server may differ from a hosted vendor       |
| Hosted service                  | Behavior against a particular deployed service                     | Requires credentials and depends on external availability |

See [Provider integration tests](integration-testing.md) to run the credential-free
server suites. The repository separates deterministic application tests from provider integration
fixtures and browser tests. For commands and provider-specific limits, see
`tests/providers/README.md` and `CONTRIBUTING.md` in the repository. A passing mock
test is not evidence that a hosted connection works.
