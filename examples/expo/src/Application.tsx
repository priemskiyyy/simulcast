import type React from "react";
import {
  applicationReducer,
  initialApplicationState,
  resolveSource,
} from "example-shared";
import { StatusBar } from "expo-status-bar";
import { useMemo, useReducer } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useAppActive } from "src/hooks/useAppActive";
import { RealtimeProvider } from "@priemskiyyy/simulcast-react";
import { createRealtimeClient } from "src/realtime/createRealtimeClient";
import { Dashboard } from "src/components/Dashboard/Dashboard";
import { Header } from "src/components/Header/Header";
import { SimulationControls } from "src/components/SimulationControls/SimulationControls";
import "src/global.css";

export const Application: React.FunctionComponent = () => {
  const [state, dispatch] = useReducer(
    applicationReducer,
    initialApplicationState,
  );
  const { sourceType, endpoint } = state;
  const isAppActive = useAppActive();
  // The adapter captures its endpoint, so the client changes exactly when the source does.
  const realtime = useMemo(
    () => createRealtimeClient(resolveSource({ sourceType, endpoint })),
    [sourceType, endpoint],
  );

  return (
    <SafeAreaProvider>
      <RealtimeProvider
        client={realtime.client}
        session={{ enabled: state.enabled && isAppActive }}
      >
        <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
          <StatusBar style="auto" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mx-auto w-full max-w-3xl gap-4 p-4"
            automaticallyAdjustKeyboardInsets
            nestedScrollEnabled={false}
            keyboardShouldPersistTaps="handled"
          >
            <Header
              state={state}
              onSourceSelect={(nextSourceType) =>
                dispatch({
                  type: "SOURCE_SELECTED",
                  sourceType: nextSourceType,
                })
              }
              onEndpointChange={(nextEndpoint) =>
                dispatch({ type: "ENDPOINT_CHANGED", endpoint: nextEndpoint })
              }
              onRoomChange={(roomId) =>
                dispatch({ type: "ROOM_CHANGED", roomId })
              }
              onSessionToggle={() => dispatch({ type: "SESSION_TOGGLED" })}
            />
            {realtime.publish === null ? null : (
              <SimulationControls
                roomId={state.roomId}
                publish={realtime.publish}
              />
            )}
            <View key={state.roomId}>
              <Dashboard roomId={state.roomId} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </RealtimeProvider>
    </SafeAreaProvider>
  );
};
