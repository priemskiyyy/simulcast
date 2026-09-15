import type { Accessor } from "solid-js";

/** Reads a value that may be wrapped in an accessor. Only non-function values are accepted, so nothing is ambiguous. */
export const access = <TValue extends string | boolean | undefined>(
  value: TValue | Accessor<TValue>,
): TValue => (typeof value === "function" ? value() : value);
