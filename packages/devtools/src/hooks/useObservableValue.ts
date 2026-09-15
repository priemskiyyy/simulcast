import { createEffect, createSignal, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";
import type { ObservableValue } from "@priemskiyyy/simulcast";

/** Mirrors a `get`/`subscribe` source into a signal. A new source is followed when the accessor changes. */
export const useObservableValue = <TValue>(
  source: Accessor<ObservableValue<TValue>>,
): Accessor<TValue> => {
  const [value, setValue] = createSignal(source().get());

  createEffect(() => {
    const current = source();
    setValue(() => current.get());
    onCleanup(current.subscribe(() => setValue(() => current.get())));
  });

  return value;
};
