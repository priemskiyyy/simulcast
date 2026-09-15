// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { Centrifuge } from "centrifuge";
import type { PropsWithChildren } from "react";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import { RealtimeProvider } from "@priemskiyyy/simulcast-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { centrifugo } from "src/centrifugo";
import { useCentrifuge } from "src/hooks/useCentrifuge";

beforeEach(() => {
  vi.spyOn(Centrifuge.prototype, "connect").mockImplementation(() => {});
});
afterEach(cleanup);

const createWrapper = (client: RealtimeClient, enabled = true) =>
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <RealtimeProvider client={client} session={{ enabled }}>
        {children}
      </RealtimeProvider>
    );
  };

test("returns the native client while a Centrifugo session is active", () => {
  const client = new RealtimeClient({
    adapter: centrifugo({ transport: "ws://localhost:8000" }),
  });
  const { result, unmount } = renderHook(() => useCentrifuge(), {
    wrapper: createWrapper(client),
  });

  expect(result.current).toBeInstanceOf(Centrifuge);
  expect(result.current).toBe(client.native.get());
  unmount();
  expect(client.native.get()).toBeNull();
});

test("returns null while disabled and for other adapters", () => {
  const disabled = renderHook(() => useCentrifuge(), {
    wrapper: createWrapper(
      new RealtimeClient({
        adapter: centrifugo({ transport: "ws://localhost:8000" }),
      }),
      false,
    ),
  });
  expect(disabled.result.current).toBeNull();

  const { adapter, connections } = createMockAdapter();
  const other = renderHook(() => useCentrifuge(), {
    wrapper: createWrapper(new RealtimeClient({ adapter })),
  });
  expect(connections).toHaveLength(1);
  expect(other.result.current).toBeNull();
});
