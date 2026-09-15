/** Reads a value that may be wrapped in a getter. Only non-function values are accepted, so nothing is ambiguous. */
export const extract = <TValue extends string | boolean | undefined>(
  value: TValue | (() => TValue),
): TValue => (typeof value === "function" ? value() : value);
