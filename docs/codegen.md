---
description: "Generate typed React, Vue, Solid, or Svelte event hooks from TypeScript event maps with the Simulcast CLI."
---

# Code generation

`@priemskiyyy/simulcast-codegen` reads your [event map](typed-events.md) and writes one named
hook per event.

```ts
// you write this once
export type Events = {
  "message.created": { channel: `rooms:${string}`; payload: Message };
};
```

```tsx
// and call this everywhere
useMessageCreated("rooms:demo", (message) => console.log(message.text));
```

`useChannelEvent(channel, "message.created", handler)` already works and is fully
typed. Generated hooks provide named imports for those calls, keep the map's
channel and payload constraints, and reference `Events["message.created"]["payload"]`
so edits to `Message` flow through without regenerating.

## Install

```sh
pnpm add -D @priemskiyyy/simulcast-codegen typescript
```

Node `>=22.18`, TypeScript `>=5.8 <6`.

## Configure

Create `realtime.config.json` at the application root:

```json
{
  "$schema": "./node_modules/@priemskiyyy/simulcast-codegen/config.schema.json",
  "events": { "file": "src/realtime/Events.ts", "type": "Events" },
  "dispatcher": {
    "file": "src/realtime/useChannelEvent.ts",
    "export": "useChannelEvent"
  },
  "output": "src/hooks/generated"
}
```

| Field        | Meaning                                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`     | The module and exported type name of your event map                                                                                                                                           |
| `dispatcher` | The module and export of your `useChannelEvent`                                                                                                                                               |
| `output`     | Directory for generated hooks                                                                                                                                                                 |
| `runtime`    | Optional. The binding generated hooks import from: `@priemskiyyy/simulcast-react` (default), `@priemskiyyy/simulcast-vue`, `@priemskiyyy/simulcast-solid`, or `@priemskiyyy/simulcast-svelte` |
| `imports`    | Optional. `{ "extension": "js" }` (default) keeps Node-style `.js` imports; `"none"` omits them for Metro and other bundlers that resolve TypeScript sources directly                         |
| `tsconfig`   | Optional. Defaults to the nearest config above the event-map file                                                                                                                             |
| `hookNames`  | Optional. Overrides for generated names                                                                                                                                                       |

Paths are relative to the configuration file, and JSON comments are allowed. The
`$schema` link gives editors completion and validation; it is generated from the
same schema that validates the file at runtime.

## Run

```sh
pnpm exec simulcast-codegen generate   # write hooks
pnpm exec simulcast-codegen check      # report drift, change nothing, exit 1 if stale
pnpm exec simulcast-codegen watch      # regenerate as types and config change
```

Every command takes `--config path/to/config.json`, and running with no command
is `generate`. Commit the generated hooks and their manifest, then run `check`
in CI before typechecking.

## Names and ownership

`message.created` becomes `useMessageCreated`. Override with
`{ "hookNames": { "message.created": "useNewMessage" } }`. Names must match
`use[A-Z][a-zA-Z0-9]*`, and collisions fail before anything is written.

The output directory holds one file per hook, an `index.ts`, and
`.simulcast-codegen.json` recording what was generated. A stale hook is deleted
only if it is listed in that manifest and still carries the generated header. A
handwritten file where a hook would go makes generation refuse rather than
overwrite.

## What the event map must be

Finite, required, string keys, each with required `channel: string` and
`payload` fields. Template-literal channels, imported DTOs, re-exports,
intersections, and generic maps with defaults are supported. Numeric and symbol
keys, index signatures, unions of maps, and optional fields are rejected with a
message naming the event.

## Programmatic use

```ts
import { CodegenFailure, generateHooks } from "@priemskiyyy/simulcast-codegen";

try {
  const result = generateHooks("realtime.config.json", { check: true });
  console.log(result.events, result.changed, result.output);
} catch (error) {
  if (error instanceof CodegenFailure) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
```

`CodegenFailure` means a problem with your project. Anything else is a bug in the
tool and keeps its stack.
