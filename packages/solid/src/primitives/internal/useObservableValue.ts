import { createEffect, createSignal, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";
import type { ObservableValue } from "simulcast";

/**
 * Mirrors an observable into a signal. The accessor is tracked, so a new
 * observable is followed when its inputs change. Effects do not run on the
 * server, which keeps server rendering on the initial snapshot.
 */
export const useObservableValue = <TValue>(
  observable: Accessor<ObservableValue<TValue>>,
): Accessor<TValue> => {
  const [value, setValue] = createSignal(observable().get());

  createEffect(() => {
    const current = observable();
    setValue(() => current.get());
    onCleanup(
      current.subscribe(() => {
        setValue(() => current.get());
      }),
    );
  });

  return value;
};
