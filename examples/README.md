# Mission Control examples

Each example uses six generated, Zod-parsed event hooks across four shared
subscriptions: `rooms:<room>`, `metrics`, `alerts`, and `deploys`. The domain,
reducer, simulation, and web CVA styles live in `shared`; components and lifecycle
code use each framework's own primitives.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm generate:hooks
pnpm --filter example-react dev
```

Use `example-vue`, `example-solid`, or `example-svelte` for the other web bindings.
[Expo](expo/README.md) covers iOS, Android, and web with `simulcast-react`.

Simulation runs without a backend. Web examples publish through BroadcastChannel
between tabs on the same origin. Expo uses a local in-memory adapter. Switch to
Centrifugo to use a server; disconnect before changing its WebSocket endpoint.
The server must accept the example's origin and channels and publish the envelopes
in `shared/src/realtime/Envelope.ts`.

```sh
pnpm check          # Types, lint, formatting, unit tests, codegen, and web builds
pnpm test:examples  # All five examples at phone and desktop widths; no Docker needed
```
