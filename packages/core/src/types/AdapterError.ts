/** Wraps the original provider error so the core never discards it. */
export type AdapterError = {
  error: unknown;
};
