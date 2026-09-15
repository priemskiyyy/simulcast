---
description: "Validate realtime payloads with Zod, Valibot, ArkType, or TypeScript. Decode JSON and MQTT bytes and handle malformed messages."
---

# Parse incoming messages

TypeScript types describe the payload your application expects. They do not
check what a server sends. Pass a synchronous `parse` function to `useChannel`
to validate or transform a publication before its handler runs.

The examples below use React. Vue, Solid, and Svelte bindings accept the same
parser option. Render the example components beneath a configured
`RealtimeProvider`; see [Getting started](getting-started.md).

## Validate with Zod

Install Zod in your application:

```sh
pnpm add zod
```

Define the payload once and derive its TypeScript type from the schema. These
examples use [Zod 4](https://zod.dev/basics):

```ts [src/MessageSchema.ts]
import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export type Message = z.infer<typeof MessageSchema>;
```

Pass `MessageSchema.parse` by reference. Its return type determines the handler's
payload type; there is no need to repeat a generic:

```tsx [src/MessagePreview.tsx]
import type * as React from "react";
import { useState } from "react";
import { useChannel } from "simulcast-react";
import { MessageSchema } from "./MessageSchema";

export const MessagePreview: React.FunctionComponent = () => {
  const [text, setText] = useState("Waiting for a message");

  useChannel("rooms:demo", (message) => setText(message.text), {
    parse: MessageSchema.parse,
  });

  return <p>{text}</p>;
};
```

The handler receives the parsed result. Its optional second argument contains
the original publication, including the unparsed `data`, provider `event`, and
`native` context. [Zod object schemas](https://zod.dev/api#objects) strip unknown
keys by default; use `z.strictObject` if extra fields should be an error.

`useChannel<Message>(...)` without a parser only declares a type. It performs no
runtime validation. If you supply both a generic and a parser, their types must
agree. Named parsers and schema methods give reliable inference; an inline
parser may need an explicit return type when the handler is also unannotated.

## Validate with Valibot

Install Valibot in your application:

```sh
pnpm add valibot
```

[Valibot's `parser`](https://valibot.dev/api/parser/) creates a synchronous
function that returns the validated output and throws on invalid input:

```ts [src/valibotMessage.ts]
import * as v from "valibot";

export const MessageSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  text: v.pipe(v.string(), v.minLength(1)),
});

export type Message = v.InferOutput<typeof MessageSchema>;
export const parseMessage = v.parser(MessageSchema);
```

In `MessagePreview`, import `parseMessage` from `./valibotMessage` and use
`{ parse: parseMessage }`. The handler infers `Message` from the parser.
For a skip-on-error policy, call
[`v.safeParse(MessageSchema, data)`](https://valibot.dev/api/safeParse/)
inside the handler and read `result.output` after checking `result.success`.

## Validate with ArkType

Install ArkType in your application:

```sh
pnpm add arktype
```

[ArkType's `assert`](https://arktype.io/docs/type-api#assert) returns the
validated output or throws. The `string > 0` constraint requires a non-empty
string:

```ts [src/arktypeMessage.ts]
import { type } from "arktype";

export const MessageSchema = type({
  id: "string > 0",
  text: "string > 0",
});

export type Message = typeof MessageSchema.infer;
export const parseMessage = MessageSchema.assert;
```

In `MessagePreview`, import `parseMessage` from `./arktypeMessage` and use
`{ parse: parseMessage }`. Use `assert` for the parser option: calling
`MessageSchema(data)` directly can return an error result, which Simulcast
would pass to the handler. To skip invalid input, call the schema inside the
handler and return when `result instanceof type.errors`.

## Use TypeScript checks without a schema library

A parser can use ordinary type guards. This version checks the same required
fields and returns a new object with the narrowed types:

```ts [src/parseMessage.ts]
export const parseMessage = (data: unknown) => {
  if (typeof data !== "object" || data === null) {
    throw new Error("Expected a message object");
  }

  if (!("id" in data) || typeof data.id !== "string" || data.id.length === 0) {
    throw new Error("Expected a non-empty message id");
  }

  if (
    !("text" in data) ||
    typeof data.text !== "string" ||
    data.text.length === 0
  ) {
    throw new Error("Expected non-empty message text");
  }

  return { id: data.id, text: data.text };
};
```

Import `parseMessage` into `MessagePreview` and use `{ parse: parseMessage }`.
The handler still infers `{ id: string; text: string }`. This alternative does
not require Zod.

## Decode the wire format first

A schema for an object cannot validate an encoded JSON string or a byte buffer.
Convert the wire payload, then validate the result.

### JSON text from SSE or WebSocket

The SSE adapter supplies strings. A WebSocket protocol decoder decides what
reaches `publication.data`; use this parser when that value is JSON text:

```ts [src/parseJsonMessage.ts]
import { MessageSchema } from "./MessageSchema";

export const parseJsonMessage = (data: unknown) => {
  if (typeof data !== "string") {
    throw new Error("Expected a JSON text message");
  }

  const payload: unknown = JSON.parse(data);
  return MessageSchema.parse(payload);
};
```

Use `{ parse: parseJsonMessage }` in the consumer. If your WebSocket decoder
already produces an object, use `MessageSchema.parse` directly. This parser
does not accept binary WebSocket frames or `Blob` values.

### MQTT bytes

The MQTT adapter supplies a `Buffer`, which is a `Uint8Array`. Decode UTF-8
before parsing JSON:

```ts [src/parseMqttMessage.ts]
import { MessageSchema } from "./MessageSchema";

const decoder = new TextDecoder("utf-8", { fatal: true });

export const parseMqttMessage = (data: unknown) => {
  if (!(data instanceof Uint8Array)) {
    throw new Error("Expected an MQTT byte payload");
  }

  const payload: unknown = JSON.parse(decoder.decode(data));
  return MessageSchema.parse(payload);
};
```

Use this parser with your MQTT topic or filter, such as `rooms/demo` or
`rooms/+`. The runtime needs `TextDecoder`. Invalid UTF-8, invalid JSON, and
invalid message fields each fail before the handler runs.

## Choose a malformed-message policy

The parsers above throw on invalid input. Simulcast isolates that failure from
other consumers, then throws it in a microtask. In a browser it reaches the
global error handler; in Node it is an uncaught exception unless handled by
the application. It does not become a channel subscription error. See
[Errors and recovery](error-handling.md).

If malformed messages are expected and should be skipped, validate in the
handler with `safeParse` and return on failure:

```tsx [src/TolerantMessagePreview.tsx]
import type * as React from "react";
import { useState } from "react";
import { useChannel } from "simulcast-react";
import { MessageSchema } from "./MessageSchema";

export const TolerantMessagePreview: React.FunctionComponent = () => {
  const [text, setText] = useState("Waiting for a message");

  useChannel("rooms:demo", (data) => {
    const result = MessageSchema.safeParse(data);
    if (!result.success) {
      console.warn("Skipped an invalid room message", {
        issueCount: result.error.issues.length,
      });
      return;
    }

    setText(result.data.text);
  });

  return <p>{text}</p>;
};
```

This logs the failure without logging the message body. Use your application's
reporting function if needed. `safeParse` handles schema failures; it does not
catch errors thrown earlier by `JSON.parse` or `TextDecoder`. Handle those
separately at the decoding step if your policy is to skip malformed wire data.

Returning `null` or `undefined` from a `useChannel` parser does **not** skip the
publication: that value is passed to its handler. Keep the skip decision in the
handler, or use an event decoder when routing an envelope.

## Separate event routing from payload parsing

`createChannelEventHooks` has a different `decode` option:

| Function                 | Receives              | Returns                                    | Runs                                           |
| ------------------------ | --------------------- | ------------------------------------------ | ---------------------------------------------- |
| `useChannel` parser      | `publication.data`    | The handler's payload                      | For each publication received by that consumer |
| Event `decode`           | The whole publication | `{ eventType, payload }` or `null` to skip | Before event-name matching, for each consumer  |
| `useChannelEvent` parser | The decoded payload   | That event's declared payload type         | Only for a matching event                      |

For an already decoded envelope such as
`{ name: "message.created", body: { id: "1", text: "Hello" } }`:

```ts [src/messageEvents.ts]
import { z } from "zod";
import { createChannelEventHooks } from "simulcast-react";
import type { Message } from "./MessageSchema";

const EnvelopeSchema = z.object({ name: z.string(), body: z.unknown() });

type Events = {
  "message.created": { channel: `rooms:${string}`; payload: Message };
};

export const { useChannelEvent } = createChannelEventHooks<Events>({
  decode: ({ data }) => {
    const result = EnvelopeSchema.safeParse(data);
    if (!result.success) {
      console.warn("Skipped an invalid event envelope");
      return null;
    }

    return { eventType: result.data.name, payload: result.data.body };
  },
});
```

Validate the matching event's body in its consumer:

```tsx [src/MessageEventPreview.tsx]
import type * as React from "react";
import { useState } from "react";
import { useChannelEvent } from "./messageEvents";
import { MessageSchema } from "./MessageSchema";

export const MessageEventPreview: React.FunctionComponent = () => {
  const [text, setText] = useState("Waiting for a message");

  useChannelEvent(
    "rooms:demo",
    "message.created",
    (message) => setText(message.text),
    {
      parse: MessageSchema.parse,
    },
  );

  return <p>{text}</p>;
};
```

This policy skips malformed envelopes and unrelated event names, but reports
invalid bodies for `message.created` through the throwing parser. If your
provider already sets `publication.event`, omit the custom decoder. For JSON
text or MQTT envelopes, decode the wire format before checking the envelope.
See [Typed events](typed-events.md) for event maps and generated hooks.
