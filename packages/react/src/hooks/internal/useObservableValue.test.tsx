// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useObservableValue } from "src/hooks/internal/useObservableValue";

test("the optional callback adds a listener only while present and reads the latest callback", () => {
  let value = 0;
  const listeners = new Set<() => void>();
  const cleanups: Array<ReturnType<typeof vi.fn>> = [];
  const subscribe = vi.fn((listener: () => void) => {
    listeners.add(listener);
    const cleanup = vi.fn(() => {
      listeners.delete(listener);
    });
    cleanups.push(cleanup);
    return cleanup;
  });
  const set = (next: number) => {
    value = next;
    listeners.forEach((listener) => listener());
  };
  const observable = { get: () => value, subscribe };
  const { result, rerender, unmount } = renderHook(
    ({ onChange }: { onChange?: (value: number) => void }) =>
      useObservableValue(observable, () => 0, onChange),
    { initialProps: {} },
  );
  expect(result.current).toBe(0);
  expect(subscribe).toHaveBeenCalledTimes(1);
  const first = vi.fn();
  rerender({ onChange: first });
  expect(subscribe).toHaveBeenCalledTimes(2);
  const latest = vi.fn();
  rerender({ onChange: latest });
  expect(subscribe).toHaveBeenCalledTimes(2);
  act(() => set(1));
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledExactlyOnceWith(1);
  rerender({});
  act(() => set(2));
  expect(latest).toHaveBeenCalledTimes(1);
  expect(result.current).toBe(2);
  unmount();
  expect(cleanups).toHaveLength(2);
  cleanups.forEach((cleanup) => expect(cleanup).toHaveBeenCalledTimes(1));
});
