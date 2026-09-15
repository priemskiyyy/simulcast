import { expect, test } from "vitest";
import { GENERATED_HEADER, renderHooks } from "src/utils/renderHooks";

test.each([
  ["ts", "js"],
  ["tsx", "js"],
  ["mts", "mjs"],
  ["cts", "cjs"],
  ["d.mts", "mjs"],
])(
  "preserves TypeScript module format for %s imports",
  (sourceExtension, outputExtension) => {
    const files = renderHooks(
      {
        events: { file: `/project/events.${sourceExtension}`, type: "Events" },
        dispatcher: {
          file: `/project/runtime.${sourceExtension}`,
          export: "useChannelEvent",
        },
        output: "/project/generated",
      },
      ["message.created"],
    );
    expect(files.get("useMessageCreated.ts")).toContain(
      `from "../events.${outputExtension}"`,
    );
    expect(files.get("useMessageCreated.ts")).toContain(
      `from "../runtime.${outputExtension}"`,
    );
  },
);

test("imports hook types from the configured runtime", () => {
  const files = renderHooks(
    {
      events: { file: "/project/events.ts", type: "Events" },
      dispatcher: { file: "/project/runtime.ts", export: "useChannelEvent" },
      output: "/project/generated",
      runtime: "@priemskiyyy/simulcast-vue",
    },
    ["message.created"],
  );

  expect(files.get("useMessageCreated.ts")).toContain(
    'import type { ChannelInput, PublicationHandler, UseChannelOptions } from "@priemskiyyy/simulcast-vue"',
  );
});

test("omits import extensions for bundlers that resolve TypeScript sources directly", () => {
  const files = renderHooks(
    {
      events: { file: "/project/Events.ts", type: "Events" },
      dispatcher: { file: "/project/runtime.ts", export: "useChannelEvent" },
      output: "/project/generated",
      imports: { extension: "none" },
    },
    ["message.created"],
  );

  expect(files.get("useMessageCreated.ts")).toContain('from "../runtime"');
  expect(files.get("useMessageCreated.ts")).toContain('from "../Events"');
  expect(files.get("index.ts")).toBe(
    `${GENERATED_HEADER}export { useMessageCreated } from "./useMessageCreated";\n`,
  );
});
