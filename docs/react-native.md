---
description: "Use Simulcast with Expo and React Native, manage background connection sessions, and run the native Mission Control example."
---

# React Native and Expo

Use `simulcast-react` for React Native. Session ownership, shared subscriptions,
typed event hooks, and parsing use the same API as React on the web. The selected
provider SDK must support your native runtime.

## Start with the Expo example

The Expo example in `examples/expo`
starts with in-memory simulated traffic and needs no credentials. After the
[repository setup](examples.md#run-an-example-without-credentials):

```sh
pnpm --filter example-expo dev
```

The example uses Expo SDK 57. Open it with a compatible Expo Go installation, or
run the `ios` or `android` package script with a simulator or emulator available.
Its dependency versions follow Expo's compatibility requirements.

## Install in an existing application

For Centrifugo:

```sh
pnpm add simulcast simulcast-react simulcast-centrifugo centrifuge
```

Keep the React version required by your Expo SDK, and check it against
`simulcast-react`'s `>=19.2 <20` peer requirement. Use Expo's installer for native
libraries; do not independently upgrade React or React Native to resolve a peer
warning.

## Pause a session in the background

Choose a background policy deliberately. The example releases its session when
the application is inactive and reconnects when active. A minimal provider is:

```tsx
import type * as React from "react";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { RealtimeProvider } from "simulcast-react";
import { realtime } from "./realtime";

type ApplicationRealtimeProps = React.PropsWithChildren;

export const ApplicationRealtime: React.FunctionComponent<
  ApplicationRealtimeProps
> = ({ children }) => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const listener = AppState.addEventListener("change", setAppState);
    return () => listener.remove();
  }, []);

  return (
    <RealtimeProvider
      client={realtime}
      session={{ enabled: appState === "active" }}
    >
      {children}
    </RealtimeProvider>
  );
};
```

This creates a fresh session on return. It does not preserve messages received
while inactive; refetch current state or use your provider's recovery features.
Background delivery and notifications require platform-specific infrastructure.

## Connect to a server

- On a physical device, use a reachable LAN address for your development machine.
- Android emulators commonly use `10.0.2.2` to reach the host machine.
- Use `wss://` for remote WebSocket deployments.
- Ensure the server accepts the configured channel names and authentication.

## Inspect and verify

The Simulcast devtools render into the DOM and are available in the browser
examples. For a native application, inspect core diagnostics programmatically
or use React Native DevTools for the application itself.

The Expo example loads English Intl plural and relative-time polyfills before
its shared formatters run on Hermes. Those polyfills serve the example's UI;
they are not a core Simulcast requirement.

```sh
pnpm --filter example-expo check:dependencies
pnpm --filter example-expo build:native
```

These checks validate dependency compatibility and native bundling. They do not
establish that every provider SDK works on every device or replace a native
interaction test.
