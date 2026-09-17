---
description: "Run credential-free Mission Control examples in React, Vue, Solid, Svelte, and Expo and inspect their shared realtime subscriptions."
---

<script setup>
// The demo is a separate application, not a page of this site, so these links
// leave the router rather than being handled by it.
import { withBase } from "vitepress";
</script>

# Examples

The repository includes the same Mission Control dashboard in React, Vue, Solid,
Svelte, and Expo. Each example receives messages, metrics, alerts, and deployment
updates through six generated event hooks and four shared subscriptions.

## Open the live demo

The React example is hosted at <a :href="withBase('/demo/')" target="_blank" rel="noreferrer">priemskiyyy.github.io/simulcast/demo</a>
with no backend, account, or credentials. Open the Simulcast Devtools launcher,
add and remove consumers, watch listener counts, and confirm that several widgets
share one native subscription per channel.

## Run an example without credentials

From a checkout of the repository:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm generate:hooks
pnpm --filter example-react dev
```

Use Node 22.18 or newer and the pnpm version declared in `package.json`.

| Framework | Start command                      | Source            |
| --------- | ---------------------------------- | ----------------- |
| React     | `pnpm --filter example-react dev`  | `examples/react`  |
| Vue       | `pnpm --filter example-vue dev`    | `examples/vue`    |
| Solid     | `pnpm --filter example-solid dev`  | `examples/solid`  |
| Svelte    | `pnpm --filter example-svelte dev` | `examples/svelte` |
| Expo      | `pnpm --filter example-expo dev`   | `examples/expo`   |

Browser examples use BroadcastChannel to exchange simulated events between tabs
on the same origin. Expo uses an in-memory simulation adapter. Neither mode needs
a hosted account or backend.

## What to explore

1. **Publish manually.** Pause automatic traffic and send a message, alert, metric,
   or deployment update. Observe the corresponding UI update.
2. **Switch rooms.** The room subscription changes while the shared metrics,
   alerts, and deployment subscriptions remain independent.
3. **Disconnect and reconnect.** Observe session teardown and restoration.
4. **Open devtools in a browser example.** Inspect listener counts, select a
   channel, and enable payload capture to inspect subsequent publications.
5. **Open another tab.** Use the same origin and room to see shared simulated traffic.

## Connect to Centrifugo

The examples also offer a Centrifugo mode. Disconnect before changing its
WebSocket endpoint. Your server must accept the application's origin and channels.
Publish the envelope shape defined by
`examples/shared/src/realtime/Envelope.ts`.
Switching the connection alone does not start a server-side publisher.

On a physical phone, use your computer's reachable LAN address instead of
`localhost`. See [React Native and Expo](react-native.md).

## Learn from the source

| Concern                                    | Implementation                            |
| ------------------------------------------ | ----------------------------------------- |
| Payload validation and event map           | `examples/shared/src/realtime`            |
| Client registration for typed hooks        | Each example's `src/realtime/register.ts` |
| Framework bindings and component lifecycle | Each framework's `src` directory          |
| Generated event hooks                      | Each example's configured codegen output  |
| Shared simulation, reducer, and web styles | `examples/shared/src`                     |
| Native lifecycle and layout                | `examples/expo/src`                       |

The examples use Zod parsers, exhaustive domain matching with ts-pattern, CVA
variants, and `clsx` class composition. Components use each framework's own
state and lifecycle APIs.

## Check the examples

```sh
pnpm test:examples
```

This builds the examples and runs browser checks at phone and desktop widths.
It does not exercise an iOS simulator or Android emulator.

For native bundle and dependency checks:

```sh
pnpm --filter example-expo check:dependencies
pnpm --filter example-expo build:native
```

Native bundling checks compilation; use the running native app to verify layout,
keyboard behavior, and background transitions on your target device.
