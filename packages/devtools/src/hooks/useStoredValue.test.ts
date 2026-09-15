import { createRoot } from "solid-js";
import { afterEach, expect, test } from "vitest";
import { z } from "zod";
import { useStoredValue } from "src/hooks/useStoredValue";

const schema = z.object({ height: z.number() });

afterEach(() => {
  localStorage.clear();
});

test("reads valid stored values, ignores corrupt ones, writes through, and follows other tabs", () => {
  localStorage.setItem("corrupt", "{not json");
  localStorage.setItem("valid", JSON.stringify({ height: 300 }));

  createRoot((dispose) => {
    const [corrupt] = useStoredValue("corrupt", schema, { height: 1 });
    const [valid, setValid] = useStoredValue("valid", schema, { height: 1 });

    expect(corrupt()).toEqual({ height: 1 });
    expect(valid()).toEqual({ height: 300 });
    setValid({ height: 420 });
    expect(localStorage.getItem("valid")).toBe(JSON.stringify({ height: 420 }));

    localStorage.setItem("valid", JSON.stringify({ height: 500 }));
    window.dispatchEvent(new StorageEvent("storage", { key: "valid" }));
    expect(valid()).toEqual({ height: 500 });
    dispose();
  });
});
