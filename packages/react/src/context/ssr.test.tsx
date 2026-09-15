// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import { expect, test, vi } from "vitest";
import { RealtimeProvider } from "src/context/RealtimeProvider";
import { useChannel } from "src/hooks/useChannel";
import { useChannelStatus } from "src/hooks/useChannelStatus";
import { useConnectionState } from "src/hooks/useConnectionState";

test("SSR is inert and hydrates from the same snapshots before connecting", async () => {
  const { adapter, connections } = createMockAdapter({
    onConnect: (connection) => connection.observer.state("connecting"),
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  const client = new RealtimeClient({ adapter });
  const onRecoverableError = vi.fn();
  const Status = () => {
    useChannel("rooms:one", () => {});
    const connection = useConnectionState();
    const channel = useChannelStatus("rooms:one");
    return <span>{`${connection}/${channel.state}`}</span>;
  };
  const view = (
    <RealtimeProvider client={client}>
      <Status />
    </RealtimeProvider>
  );
  const html = renderToString(view);
  expect(html).toContain("disconnected/detached");
  expect(connections).toEqual([]);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  let root: ReturnType<typeof hydrateRoot> | undefined;

  try {
    await act(async () => {
      root = hydrateRoot(container, view, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(connections).toHaveLength(1);
    expect(container.textContent).toBe("connecting/subscribing");
  } finally {
    act(() => root?.unmount());
    container.remove();
  }
});
