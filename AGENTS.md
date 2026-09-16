# Agent guide

Simulcast is a realtime subscription runtime with framework bindings and
provider adapters. Before changing code, read `CONTRIBUTING.md` for layout and
style, `docs/internals/architecture.md` for the invariants, and the tests beside
the file you touch.

- Adding a provider: follow `.claude/skills/create-adapter/SKILL.md` and
  `docs/writing-an-adapter.md`. Every adapter runs `testRealtimeAdapter` from
  `@priemskiyyy/simulcast/testing`.
- Integrating Simulcast in an application: `docs/getting-started.md`, then the
  framework page (`docs/hooks.md`, `vue.md`, `solid.md`, `svelte.md`) and the
  adapter section in `docs/adapters.md`. One `RealtimeClient` per application;
  `useChannel` creates demand, `useChannelStatus` does not.
- Style: grouped props, `typeof x === "function"` guards, no `as` casts,
  `assertUnreachable` at union dispatch, handlers named `handle*`, arrow
  functions exported one per file, JSDoc with an example on public hooks.
- Verify with `pnpm check`. Do not commit or publish unless asked.
