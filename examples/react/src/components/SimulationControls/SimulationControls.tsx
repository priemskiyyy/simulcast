import type React from "react";
import { simulationButtonStyles } from "example-shared/styles/simulationButtonStyles";
import {
  Bell,
  ChartLineUp,
  Cpu,
  PaperPlaneTilt,
  Pause,
  Play,
  RocketLaunch,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { createBroadcastPublisher, createSimulation } from "example-shared";
import { useEffect, useState } from "react";

type SimulationControlsProps = {
  roomId: string;
};

/** Owns the in-page simulation: it publishes through BroadcastChannel, so every tab on this origin receives the traffic. */
export const SimulationControls: React.FunctionComponent<
  SimulationControlsProps
> = ({ roomId }) => {
  const [publisher] = useState(createBroadcastPublisher);
  const [simulation] = useState(() =>
    createSimulation({ publish: publisher.publish, roomId }),
  );
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    simulation.setRoom(roomId);
  }, [simulation, roomId]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    simulation.start();
    return simulation.stop;
  }, [simulation, isRunning]);

  useEffect(() => publisher.close, [publisher]);

  return (
    <section
      aria-label="Simulation"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
    >
      <p className="mr-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <Cpu size={16} weight="duotone" />
        Simulated traffic through BroadcastChannel. Open a second tab to watch
        it stay in sync.
      </p>
      <button
        type="button"
        aria-pressed={isRunning}
        onClick={() => setIsRunning((current) => !current)}
        className={simulationButtonStyles({ running: isRunning })}
      >
        {isRunning ? (
          <Pause size={14} weight="bold" />
        ) : (
          <Play size={14} weight="bold" />
        )}
        {isRunning ? "Pause" : "Resume"}
      </button>
      <SimulationButton
        icon={PaperPlaneTilt}
        label="Send message"
        onPress={simulation.sendMessage}
      />
      <SimulationButton
        icon={ChartLineUp}
        label="Report metrics"
        onPress={simulation.reportMetrics}
      />
      <SimulationButton
        icon={Bell}
        label="Raise alert"
        onPress={simulation.raiseAlert}
      />
      <SimulationButton
        icon={RocketLaunch}
        label="Advance deploy"
        onPress={simulation.advanceDeploy}
      />
    </section>
  );
};

type SimulationButtonProps = {
  icon: Icon;
  label: string;
  onPress: () => void;
};

const SimulationButton: React.FunctionComponent<SimulationButtonProps> = ({
  icon: ButtonIcon,
  label,
  onPress,
}) => (
  <button type="button" onClick={onPress} className={simulationButtonStyles()}>
    <ButtonIcon size={14} weight="bold" />
    {label}
  </button>
);
