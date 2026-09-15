/** Runs synchronous work and returns its thrown value, if any. */
export const captureError = (task: () => void): unknown[] => {
  try {
    task();
    return [];
  } catch (error) {
    return [error];
  }
};
