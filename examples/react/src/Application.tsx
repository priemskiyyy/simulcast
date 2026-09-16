import type React from "react";
import {
  applicationReducer,
  createRealtimeClient,
  initialApplicationState,
  resolveSource,
} from "example-shared";
import { useMemo, useReducer, useState } from "react";
import { SimulcastDevtools } from "@priemskiyyy/simulcast-devtools/react";
import { RealtimeProvider } from "@priemskiyyy/simulcast-react";
import { Dashboard } from "src/components/Dashboard/Dashboard";
import { Header } from "src/components/Header/Header";
import { SharedSubscriptionPanel } from "src/components/SharedSubscriptionPanel/SharedSubscriptionPanel";
import { SimulationControls } from "src/components/SimulationControls/SimulationControls";
import "src/styles.css";

export const Application: React.FunctionComponent = () => {
  const [state, dispatch] = useReducer(
    applicationReducer,
    initialApplicationState,
  );
  const [dashboardMounted, setDashboardMounted] = useState(true);
  const { sourceType, endpoint } = state;
  // The adapter captures its endpoint, so the client changes exactly when the source does.
  const client = useMemo(
    () => createRealtimeClient(resolveSource({ sourceType, endpoint })),
    [sourceType, endpoint],
  );

  return (
    <RealtimeProvider client={client} session={{ enabled: state.enabled }}>
      <Header
        state={state}
        onSourceSelect={(sourceType) =>
          dispatch({ type: "SOURCE_SELECTED", sourceType })
        }
        onEndpointChange={(endpoint) =>
          dispatch({ type: "ENDPOINT_CHANGED", endpoint })
        }
        onRoomChange={(roomId) => dispatch({ type: "ROOM_CHANGED", roomId })}
        onSessionToggle={() => dispatch({ type: "SESSION_TOGGLED" })}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        {state.sourceType === "SIMULATION" ? (
          <SimulationControls roomId={state.roomId} />
        ) : null}
        <SharedSubscriptionPanel
          roomId={state.roomId}
          dashboardMounted={dashboardMounted}
          onDashboardToggle={() => setDashboardMounted((current) => !current)}
        />
        {dashboardMounted ? (
          <Dashboard key={state.roomId} roomId={state.roomId} />
        ) : null}
      </main>
      {/* Always rendered: this example is the hosted demo, where devtools are the point. */}
      <SimulcastDevtools />
    </RealtimeProvider>
  );
};
