import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { expect, test } from "vitest";
import { RealtimeProvider } from "src/components/RealtimeProvider";
import { useChannel } from "src/composables/useChannel";
import { useChannelStatus } from "src/composables/useChannelStatus";
import { useConnectionState } from "src/composables/useConnectionState";

test("server rendering reads inactive snapshots and opens no connection", async () => {
  const { adapter, connections } = createMockAdapter();
  const client = new RealtimeClient({ adapter });
  const Status = defineComponent(() => {
    useChannel("rooms:one", () => {});
    const connection = useConnectionState();
    const status = useChannelStatus("rooms:one");
    return () => h("span", `${connection.value}/${status.value.state}`);
  });
  const app = createSSRApp(
    defineComponent(
      () => () => h(RealtimeProvider, { client }, { default: () => h(Status) }),
    ),
  );

  const html = await renderToString(app);

  expect(html).toContain("disconnected/detached");
  expect(connections).toEqual([]);
});
