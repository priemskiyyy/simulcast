import type { Component } from "solid-js";
import {
  DEFAULT_ENDPOINT,
  createRealtimeClient,
  resolveSource,
} from "example-shared";
import { SimulcastDevtools } from "simulcast-devtools/solid";
import { RealtimeProvider } from "simulcast-solid";
import { Show, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { Dashboard } from "src/components/Dashboard/Dashboard";
import { Header } from "src/components/Header/Header";
import { SimulationControls } from "src/components/SimulationControls/SimulationControls";
import type { ApplicationState } from "example-shared";

export const Application: Component = () => {
  const [state, setState] = createStore<ApplicationState>({
    sourceType: "SIMULATION",
    endpoint: DEFAULT_ENDPOINT,
    roomId: "demo",
    enabled: true,
  });
  // The adapter captures its endpoint, so the client changes exactly when the source does.
  const client = createMemo(() =>
    createRealtimeClient(
      resolveSource({ sourceType: state.sourceType, endpoint: state.endpoint }),
    ),
  );

  return (
    <RealtimeProvider client={client()} session={{ enabled: state.enabled }}>
      <Header
        state={state}
        onSourceSelect={(sourceType) => setState("sourceType", sourceType)}
        onEndpointChange={(endpoint) => setState("endpoint", endpoint)}
        onRoomChange={(roomId) => setState("roomId", roomId)}
        onSessionToggle={() => setState("enabled", (enabled) => !enabled)}
      />
      <main class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <Show when={state.sourceType === "SIMULATION"}>
          <SimulationControls roomId={state.roomId} />
        </Show>
        <Show when={{ roomId: state.roomId }} keyed>
          {({ roomId }) => <Dashboard roomId={roomId} />}
        </Show>
      </main>
      <Show when={import.meta.env.DEV}>
        <SimulcastDevtools />
      </Show>
    </RealtimeProvider>
  );
};
