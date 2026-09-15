import { expect, test } from "vitest";
import * as api from "src/index";

test("the package exposes the adapter factory", () => {
  expect(Object.keys(api)).toEqual(["mqtt"]);
});
