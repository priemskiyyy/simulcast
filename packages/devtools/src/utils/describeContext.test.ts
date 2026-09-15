import type { RealtimeDiagnosticEvent } from "@priemskiyyy/simulcast";
import { expect, test, vi } from "vitest";
import { describeContext } from "src/utils/describeContext";

const event = (
  context: unknown,
  overrides: Partial<RealtimeDiagnosticEvent> = {},
): RealtimeDiagnosticEvent => ({
  source: "channel",
  channel: "rooms:one",
  type: "publication",
  timestamp: 0,
  context,
  ...overrides,
});
const format = (context: unknown, capturePayloads: boolean) =>
  describeContext(event(context), capturePayloads).context;

test("payload capture is explicit and sensitive property names stay redacted", () => {
  const context = {
    event: "message-created",
    data: {
      text: "hello",
      accessToken: "secret-value",
      nested: { password: "secret-password" },
    },
    native: { data: { text: "hello" } },
  };
  expect(format(context, false)).toContain("Payload capture is off");
  expect(format(context, false)).not.toContain("hello");
  expect(format(context, true)).toContain("hello");
  expect(format(context, true)).not.toContain("secret-value");
  expect(format(context, true)).not.toContain("secret-password");
});

test("inspection does not invoke getters, toJSON, or custom coercion", () => {
  const getter = vi.fn(() => {
    throw new Error("getter invoked");
  });
  const toJSON = vi.fn(() => {
    throw new Error("toJSON invoked");
  });
  const context = { toJSON, id: 1n };
  Object.defineProperty(context, "accessor", { enumerable: true, get: getter });
  const text = format(context, true);
  expect(text).toContain("[Accessor]");
  expect(text).toContain("1n");
  expect(getter).not.toHaveBeenCalled();
  expect(toJSON).not.toHaveBeenCalled();
});

test("cycles, deep values, wide arrays, and long text stay bounded", () => {
  const value: { self?: unknown } = {};
  value.self = value;
  expect(format(value, true)).toContain("Circular");
  const wide = Array.from({ length: 1_000 }, () => "x".repeat(20_000));
  expect(format(wide, true).length).toBeLessThan(12_100);
  expect(format(wide, true)).toContain("Truncated");
  expect(format(undefined, true)).toBe("undefined");
  expect(format(null, true)).toBe("null");
});

test("uninspectable proxies cannot interrupt publication delivery", () => {
  const proxy = new Proxy(
    {},
    {
      ownKeys: () => {
        throw new Error("blocked");
      },
    },
  );
  expect(describeContext(event(proxy), true)).toEqual({
    context: "[Unable to inspect this value]",
    summary: "",
    kind: "PUBLICATION",
  });
});

test("rows summarize their context and are classified by source and type", () => {
  const connection = (type: string, context: unknown) =>
    describeContext(
      event(context, { source: "connection", channel: null, type }),
      false,
    );
  expect(connection("state", "connected")).toMatchObject({
    summary: "connected",
    kind: "LIFECYCLE",
  });
  expect(
    connection("error", { error: { message: "refused", code: 40100 } }),
  ).toMatchObject({ summary: "refused (40100)", kind: "ERROR" });
  expect(
    describeContext(
      event(
        {
          error: { type: "subscribe", error: { code: 103, message: "denied" } },
        },
        { type: "error" },
      ),
      false,
    ),
  ).toMatchObject({ summary: "denied (103)", kind: "ERROR" });
  expect(
    describeContext(event({ error: { status: 403 } }, { type: "error" }), false)
      .summary,
  ).toBe("Unknown error");
  expect(
    describeContext(
      event({ id: 2 }, { source: "runtime", type: "session.started" }),
      false,
    ),
  ).toMatchObject({ summary: "2", kind: "RUNTIME" });
  const publication = {
    event: "message-created",
    data: { text: "hi", token: "x" },
    native: null,
  };
  expect(describeContext(event(publication), false)).toMatchObject({
    summary: "message-created",
    kind: "PUBLICATION",
  });
  expect(describeContext(event(publication), true).summary).toBe(
    'message-created · {"text":"hi","token":"[Redacted]"}',
  );
});
