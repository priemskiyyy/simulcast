import { onUnmounted, shallowReadonly, shallowRef } from "vue";

/** The current time, refreshed on an interval so relative timestamps stay honest. */
export const useNow = (intervalMs: number) => {
  const now = shallowRef(Date.now());
  const timer = setInterval(() => {
    now.value = Date.now();
  }, intervalMs);

  onUnmounted(() => clearInterval(timer));

  return shallowReadonly(now);
};
