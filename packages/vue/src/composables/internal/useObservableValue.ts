import {
  onMounted,
  onWatcherCleanup,
  shallowReadonly,
  shallowRef,
  watch,
} from "vue";
import type { ObservableValue } from "@priemskiyyy/simulcast";

/**
 * Mirrors an observable into a shallow ref. The getter is tracked, so a new
 * observable is followed when its inputs change. Subscribing waits for mount,
 * which keeps server rendering and hydration on the initial snapshot.
 */
export const useObservableValue = <TValue>(
  observable: () => ObservableValue<TValue>,
) => {
  const value = shallowRef(observable().get());

  onMounted(() => {
    watch(
      observable,
      (current) => {
        value.value = current.get();
        onWatcherCleanup(
          current.subscribe(() => {
            value.value = current.get();
          }),
        );
      },
      { immediate: true },
    );
  });

  return shallowReadonly(value);
};
