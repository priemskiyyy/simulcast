import type React from "react";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type { ApplicationState, RealtimeSource } from "example-shared";
import { Planet } from "phosphor-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { ConnectionBadge } from "src/components/ConnectionBadge/ConnectionBadge";
import { useScheme } from "src/hooks/useScheme";
import { getToneColor } from "src/utils/getToneColor";
import { haptic } from "src/utils/haptic";

type HeaderProps = {
  state: ApplicationState;
  onSourceSelect: (sourceType: RealtimeSource["type"]) => void;
  onEndpointChange: (endpoint: string) => void;
  onRoomChange: (roomId: string) => void;
  onSessionToggle: () => void;
};

const OPTIONS = [
  { type: "SIMULATION", label: "Simulation" },
  { type: "CENTRIFUGO", label: "Centrifugo" },
] as const;
// Font-size-only utilities avoid the lineHeight that offsets iOS input baselines.
const FIELD_CLASS_NAME =
  "h-11 rounded-lg border border-zinc-300 bg-white px-3 py-0 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const sourceButtonStyles = cva(
  "min-h-11 justify-center rounded-full px-4 active:opacity-70",
  { variants: { selected: { true: "bg-white dark:bg-zinc-950", false: "" } } },
);
const sourceLabelStyles = cva("text-sm font-medium", {
  variants: {
    selected: {
      true: "text-zinc-900 dark:text-zinc-100",
      false: "text-zinc-600 dark:text-zinc-400",
    },
  },
});
const sessionButtonStyles = cva(
  "min-h-11 justify-center rounded-lg px-4 active:opacity-70",
  {
    variants: {
      enabled: {
        true: "bg-zinc-900 dark:bg-zinc-100",
        false: "bg-emerald-600",
      },
    },
  },
);
const sessionLabelStyles = cva("text-sm font-semibold text-white", {
  variants: { enabled: { true: "dark:text-zinc-900", false: "" } },
});

export const Header: React.FunctionComponent<HeaderProps> = ({
  state,
  onSourceSelect,
  onEndpointChange,
  onRoomChange,
  onSessionToggle,
}) => {
  const scheme = useScheme();

  const handleSourcePress = (sourceType: RealtimeSource["type"]) => {
    haptic();
    onSourceSelect(sourceType);
  };
  const handleSessionPress = () => {
    haptic();
    onSessionToggle();
  };

  return (
    <View className="gap-3 border-b border-zinc-200 px-4 pb-4 pt-2 dark:border-zinc-800">
      <View className="flex-row items-center gap-2">
        <Planet
          size={24}
          weight="duotone"
          color={getToneColor("positive", scheme)}
        />
        <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Mission Control
        </Text>
        <View className="ml-auto">
          <ConnectionBadge />
        </View>
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Realtime source"
        className="flex-row self-start rounded-full bg-zinc-200 p-1 dark:bg-zinc-800"
      >
        {OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            accessibilityRole="radio"
            accessibilityState={{ checked: state.sourceType === option.type }}
            onPress={() => handleSourcePress(option.type)}
            className={sourceButtonStyles({
              selected: state.sourceType === option.type,
            })}
          >
            <Text
              className={sourceLabelStyles({
                selected: state.sourceType === option.type,
              })}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {state.sourceType === "CENTRIFUGO" ? (
        <TextInput
          style={{ textAlignVertical: "center" }}
          accessibilityLabel="WebSocket endpoint"
          className={clsx(FIELD_CLASS_NAME, "font-mono text-[12px]")}
          value={state.endpoint}
          editable={!state.enabled}
          accessibilityHint="Disconnect before editing the endpoint"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onEndpointChange}
        />
      ) : null}
      {state.sourceType === "CENTRIFUGO" ? (
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">
          Disconnect to edit the endpoint. On a phone, use your computer’s LAN
          address.
        </Text>
      ) : null}
      <View className="flex-row items-center gap-3">
        <TextInput
          style={{ textAlignVertical: "center" }}
          accessibilityLabel="Room"
          className={clsx(FIELD_CLASS_NAME, "flex-1 text-[14px]")}
          value={state.roomId}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onRoomChange}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleSessionPress}
          className={sessionButtonStyles({ enabled: state.enabled })}
        >
          <Text className={sessionLabelStyles({ enabled: state.enabled })}>
            {state.enabled ? "Disconnect" : "Connect"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
