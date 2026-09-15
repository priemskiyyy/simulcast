import { mount } from "@vue/test-utils";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import { RealtimeProvider } from "@priemskiyyy/simulcast-vue";
import { afterEach, expect, test } from "vitest";
import { defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { SimulcastDevtools } from "src/vue";

afterEach(() => {
  localStorage.clear();
});

const Application = (client: RealtimeClient) =>
  defineComponent(
    () => () =>
      h(
        RealtimeProvider,
        { client },
        { default: () => h(SimulcastDevtools, { initialIsOpen: true }) },
      ),
  );

test("the Vue wrapper mounts the inspector after mount and removes it on unmount", async () => {
  const { adapter, connections } = createMockAdapter();
  const client = new RealtimeClient({ adapter });
  const wrapper = mount(Application(client));
  await wrapper.vm.$nextTick();

  const host = wrapper.find("[data-simulcast-devtools]").element;
  expect(host.shadowRoot?.textContent).toContain("All channels");
  expect(connections).toHaveLength(1);
  wrapper.unmount();
  expect(host.shadowRoot?.childElementCount).toBe(0);
});

test("server rendering emits only the host element and opens no connections", async () => {
  const { adapter, connections } = createMockAdapter();
  const html = await renderToString(
    h(Application(new RealtimeClient({ adapter }))),
  );

  expect(html).toMatch(/<div data-simulcast-devtools(="")?><\/div>/);
  expect(connections).toEqual([]);
});
