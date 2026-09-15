import { expect, test } from "vitest";
import { captureError } from "src/utils/internal/captureError";

test("runs the operation synchronously and returns no errors on success", () => {
  let completed = false;
  const errors = captureError(() => {
    completed = true;
  });

  expect(completed).toBe(true);
  expect(errors).toEqual([]);
});

test.each([new Error("failed"), undefined, null, "failure"])(
  "preserves the thrown value %s without throwing to the caller",
  (failure) => {
    const errors = captureError(() => {
      throw failure;
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(failure);
  },
);
