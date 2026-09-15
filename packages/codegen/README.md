# @priemskiyyy/simulcast-codegen

Generate named event hooks from a finite TypeScript event map for React, Vue, Solid, or Svelte. The TypeScript compiler resolves imported and composed types; generation does not execute your application modules.

## Setup

```sh
pnpm add -D @priemskiyyy/simulcast-codegen typescript
```

Requires Node 22.18+ and TypeScript `>=5.8 <6`. Add `@priemskiyyy/simulcast` and your selected framework binding separately. React is the default runtime; configure `runtime` for another binding.

Create your event map and export `useChannelEvent` from `createChannelEventHooks<Events>({ decode })`:

```ts
// src/realtime/Events.ts
export type Events = {
  "message.created": { channel: `rooms:${string}`; payload: Message };
};
```

Add `realtime.config.json`:

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

Paths are relative to the configuration file. JSON comments are supported. `tsconfig` optionally selects an explicit project; otherwise the nearest config above the event-map file is used. `runtime` names the binding the generated hooks import from and defaults to `@priemskiyyy/simulcast-react`; set it to `@priemskiyyy/simulcast-vue`, `@priemskiyyy/simulcast-solid`, or `@priemskiyyy/simulcast-svelte` for those bindings. `imports.extension` defaults to `"js"`, the Node-style relative import; set it to `"none"` for Metro and other bundlers that resolve TypeScript sources without an extension.

```sh
pnpm exec simulcast-codegen generate
pnpm exec simulcast-codegen check
pnpm exec simulcast-codegen watch
```

Every command accepts `--config path/to/config.json`. Omitting the command runs `generate`.

```tsx
import { useMessageCreated } from "./hooks/generated/useMessageCreated.js";

useMessageCreated("rooms:demo", (message, publication) => {
  console.log(message, publication.event);
});
```

Each hook constrains its channel, callback, and optional parser using the source event's types. `message.created` becomes `useMessageCreated`; override names with `hookNames`. Names must match `use[A-Z][a-zA-Z0-9]*` and collisions fail before writing files.

The output holds one file per hook, an `index.ts`, and `.simulcast-codegen.json` recording generated filenames. Stale hooks are removed only when listed in the manifest and still carrying the generated header. `check` reports drift and exits with code 1 without changing files. `watch` follows imported event types and config changes and keeps running after generation errors.

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

`CodegenFailure` means a problem with your project. Anything else is a bug in the tool and keeps its stack. Event maps must have finite, required string keys with required `channel: string` and `payload` fields; numeric keys, index signatures, and unions of maps are rejected.

## License

[MIT](LICENSE)
