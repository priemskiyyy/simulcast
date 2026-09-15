/** The current time, refreshed on an interval so relative timestamps stay honest. */
export const useNow = (intervalMs: number) => {
  let now = $state(Date.now());

  $effect(() => {
    const timer = setInterval(() => {
      now = Date.now();
    }, intervalMs);

    return () => clearInterval(timer);
  });

  return {
    get current() {
      return now;
    },
  };
};
