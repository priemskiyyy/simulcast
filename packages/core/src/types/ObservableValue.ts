/** A readable snapshot with change notifications; `subscribe` never calls back initially. */
export type ObservableValue<TValue> = {
  get: () => TValue;
  subscribe: (listener: () => void) => () => void;
};
