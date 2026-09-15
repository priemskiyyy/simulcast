import type { ObservableValue } from "simulcast";
import type { ReadableBox } from "../../types/ReadableBox.js";

/**
 * Mirrors an observable into state. The getter is tracked, so a new observable
 * is followed when its inputs change. Effects do not run on the server, which
 * keeps server rendering on the initial snapshot.
 */
export const useObservableValue = <TValue>(
  observable: () => ObservableValue<TValue>,
): ReadableBox<TValue> => {
  let value = $state.raw(observable().get());

  $effect(() => {
    const current = observable();
    value = current.get();

    return current.subscribe(() => {
      value = current.get();
    });
  });

  return {
    get current() {
      return value;
    },
  };
};
