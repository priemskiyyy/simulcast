import type React from "react";
import { createSimulation } from "example-shared";
import type { Publication } from "example-shared";
import {
  Bell,
  ChartLineUp,
  Cpu,
  PaperPlaneTilt,
  Pause,
  Play,
  RocketLaunch,
} from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAppActive } from "src/hooks/useAppActive";
import { useScheme } from "src/hooks/useScheme";
import { getToneColor } from "src/utils/getToneColor";
import { haptic } from "src/utils/haptic";

type SimulationControlsProps = {
  roomId: string;
  publish: (publication: Publication) => void;
};

/** Publishes local traffic through the same subscriptions as a remote source. */
export const SimulationControls: React.FunctionComponent<
  SimulationControlsProps
> = ({ roomId, publish }) => {
  const [simulation] = useState(() => createSimulation({ publish, roomId }));
  const [isRunning, setIsRunning] = useState(true);
  const scheme = useScheme();
  const isAppActive = useAppActive();

  useEffect(() => {
    simulation.setRoom(roomId);
  }, [simulation, roomId]);

  useEffect(() => {
    if (!isRunning || !isAppActive) {
      return;
    }

    simulation.start();
    return simulation.stop;
  }, [simulation, isRunning, isAppActive]);

  return (
    <View
      accessibilityLabel="Simulation"
      className="gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
    >
      <View className="flex-row items-center gap-2">
        <Cpu size={16} weight="duotone" color="#71717a" />
        <Text className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
          Live demo. Send an event to see every channel update.
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <SimulationButton
          icon={isRunning ? Pause : Play}
          label={isRunning ? "Pause" : "Resume"}
          tint={
            isRunning
              ? getToneColor("positive", scheme)
              : getToneColor("neutral", scheme)
          }
          onPress={() => setIsRunning((current) => !current)}
        />
        <SimulationButton
          icon={PaperPlaneTilt}
          label="Message"
          onPress={simulation.sendMessage}
        />
        <SimulationButton
          icon={ChartLineUp}
          label="Metrics"
          onPress={simulation.reportMetrics}
        />
        <SimulationButton
          icon={Bell}
          label="Alert"
          onPress={simulation.raiseAlert}
        />
        <SimulationButton
          icon={RocketLaunch}
          label="Deploy"
          onPress={simulation.advanceDeploy}
        />
      </View>
    </View>
  );
};

type SimulationButtonProps = {
  icon: Icon;
  label: string;
  tint?: string;
  onPress: () => void;
};

const SimulationButton: React.FunctionComponent<SimulationButtonProps> = ({
  icon: ButtonIcon,
  label,
  tint,
  onPress,
}) => {
  const scheme = useScheme();
  const color = tint ?? getToneColor("neutral", scheme);

  const handlePress = () => {
    haptic();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      className="min-h-11 flex-row items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 active:opacity-70 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <ButtonIcon size={14} weight="bold" color={color} />
      <Text className="text-sm font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
};
