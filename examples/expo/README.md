# Expo Mission Control

A native React example using Uniwind, typed CVA variants, Phosphor icons, Zod
payload parsing, and the shared ts-pattern reducer. It starts in simulation mode.

After the root setup in [the examples guide](../README.md):

```sh
pnpm --filter example-expo dev
```

Open it in Expo Go for SDK 57, or use `ios`, `android`, or `web` in place of `dev`.
A simulator/emulator must already be available for the native shortcuts.

- Pause automatic traffic or publish a message, metric, alert, or deployment.
- Change the room to replace its subscriptions and reset the dashboard.
- Disconnect/reconnect to exercise session ownership. Backgrounding the app
  releases its session and pauses the simulator; returning restores your choice.
- For Centrifugo on a physical phone, use the computer's reachable LAN address
  instead of `localhost`. Android emulators usually reach the host at `10.0.2.2`.
  Remote deployments should use `wss://`.

The startup initializer loads English Intl plural and relative-time polyfills
before shared formatters run on Hermes. React and native dependencies are pinned
to Expo SDK 57's compatible versions. Metro uses Expo's built-in monorepo support.

```sh
pnpm --filter example-expo check:dependencies
pnpm --filter example-expo build         # Web export
pnpm --filter example-expo build:native  # iOS + Android Hermes bundles
```

The DOM-based Simulcast devtools are used by the browser framework examples.
They cannot mount in React Native; use React Native DevTools for the native app.
