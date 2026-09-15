import { expect, test } from "vitest";
import { decodeEnvelope } from "./decodeEnvelope";

test("decodes name and body envelopes and ignores everything else", () => {
  expect(
    decodeEnvelope({
      data: { name: "alert.raised", body: { id: "a1" } },
      native: null,
    }),
  ).toEqual({ eventType: "alert.raised", payload: { id: "a1" } });
  expect(decodeEnvelope({ data: { text: "hello" }, native: null })).toBeNull();
  expect(decodeEnvelope({ data: "plain", native: null })).toBeNull();
});
