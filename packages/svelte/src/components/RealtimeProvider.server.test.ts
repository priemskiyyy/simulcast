import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import { render } from "svelte/server";
import { expect, test } from "vitest";
import Harness from "../utilities/Harness.fixture.svelte";

test("server rendering opens nothing and renders the initial snapshot", () => {
  const { adapter, connections } = createMockAdapter();
  const client = new RealtimeClient({ adapter });
  const { body } = render(Harness, {
    props: { client, room: { channel: "rooms:one" } },
  });

  expect(body).toMatch(/data-testid="connection">disconnected</);
  expect(body).toMatch(/data-testid="status">detached</);
  expect(connections).toEqual([]);
});
