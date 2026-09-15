import { expect, test } from "vitest";
import * as api from "src/index";
import * as react from "src/react";

test("the entries expose the adapter factory and the React hook", () => {
  expect(Object.keys(api)).toEqual(["centrifugo"]);
  expect(Object.keys(react)).toEqual(["useCentrifuge"]);
});
