# Contributing

Use Node 22.18 or newer and the pnpm version in `package.json`. Run `pnpm install --frozen-lockfile`, then `pnpm check` before submitting a change.

## Layout

- `packages/core`: the runtime, adapter contract, and mock adapter, published as `simulcast`.
- `packages/react`: the provider and hooks.
- `packages/vue`, `packages/solid`, `packages/svelte`: the same API as composables, primitives, and rune-based utilities.
- `packages/adapters/*`: one package per provider, from `packages/adapters/centrifugo` to `packages/adapters/broadcast-channel`.
- `packages/devtools`: the browser inspector.
- `packages/codegen`: the Effect CLI that generates named hooks.
- `examples/*`: one small application per binding, each with hooks generated for its runtime.
- `tests/providers`: local transport tests for Socket.IO, MQTT, WebSocket, SSE, and BroadcastChannel, plus Ably authentication failure tests.
- `tests/partykit`, `tests/pusher`, `tests/services`: official local PartyKit, Pusher-compatible Soketi, Phoenix, and Supabase fixtures.
- `tests/browser`: a browser fixture backed by a real Centrifugo container.

Hooks live in `hooks/` (`composables/`, `primitives/`, and `utilities/` in the other bindings), runtime owners and helpers in `utils/`, constants in `utils/constants/`, and shared contracts in `types/`. Internal contracts belong in each folder's `internal/` directory. Package roots export the supported public API explicitly, one export per file.

## Code

Prefer descriptive names, early returns, `type` over `interface`, and exhaustive dispatch closed by `assertUnreachable`. Use `src/...` imports within each package, except in `packages/svelte`, which `svelte-package` builds from relative `.js` imports; its `files` list excludes the compiled `*.test.*`, `*.fixture.*`, and `*.contracts.*` outputs so only the library is published. Keep lifecycle decisions in the owner responsible for cleanup. Avoid introducing a shared abstraction for a single use.

An adapter maps one provider onto the contract and nothing more: its state maps live in `utils/constants/`, and `createRealtimeAdapter` supplies the shared bookkeeping. Add behavior tests for changes to subscription ownership, callbacks, or cleanup. Keep hook JSDoc short and include an example.

## Provider integration tests

Run `pnpm build && pnpm test:providers`. This suite uses the built public packages with a real Socket.IO server, an Aedes MQTT broker, a WebSocket server, HTTP SSE streams, and native BroadcastChannel. It needs no Docker or hosted credentials. Servers bind to automatically assigned loopback ports and are closed after each test. `pnpm check` and the package CI matrix also run it.

Run `pnpm test:partykit` for PartyKit's local runtime and `pnpm test:pusher` for the Pusher-compatible Soketi server. Both suites start and stop their own infrastructure. Pusher requires Docker.

For Phoenix and Supabase, start the local stack first:

```sh
pnpm --filter test-services services:up
pnpm test:services
pnpm --filter test-services services:down
```

Always run the cleanup command after testing. `pnpm test:integrations` runs all Node integration suites when this stack is available. The `providers-test` workflow keeps these heavier suites separate from the fast package checks.

See [the coverage matrix](tests/providers/README.md) for assertions, setup links, and limits. Ably message delivery through the hosted service remains untested without credentials.

## Browser tests

Docker is required. Run `pnpm exec playwright install chromium firefox webkit` once, then `pnpm test:browser`. The suite starts its own Centrifugo container and test servers, and removes them on exit. Ports 4173–4178 must be free.
