import type { Component } from "solid-js";
import { simulationButtonStyles } from "example-shared/styles/simulationButtonStyles";
import { createBroadcastPublisher, createSimulation } from "example-shared";
import { Bell, Cpu, Pause, Play, Rocket, Send, TrendingUp } from "lucide-solid";
import { For, createEffect, createSignal, onCleanup } from "solid-js";
import { Dynamic } from "solid-js/web";

type SimulationControlsProps = {
  roomId: string;
};

/** Owns the in-page simulation: it publishes through BroadcastChannel, so every tab on this origin receives the traffic. */
export const SimulationControls: Component<SimulationControlsProps> = (
  props,
) => {
  const publisher = createBroadcastPublisher();
  const simulation = createSimulation({
    publish: publisher.publish,
    roomId: props.roomId,
  });
  const [isRunning, setIsRunning] = createSignal(true);
  const actions = [
    { label: "Send message", icon: Send, run: simulation.sendMessage },
    {
      label: "Report metrics",
      icon: TrendingUp,
      run: simulation.reportMetrics,
    },
    { label: "Raise alert", icon: Bell, run: simulation.raiseAlert },
    { label: "Advance deploy", icon: Rocket, run: simulation.advanceDeploy },
  ];

  createEffect(() => simulation.setRoom(props.roomId));
  createEffect(() => {
    if (!isRunning()) {
      simulation.stop();
      return;
    }

    simulation.start();
  });
  onCleanup(() => {
    simulation.stop();
    publisher.close();
  });

  return (
    <section
      aria-label="Simulation"
      class="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
    >
      <p class="mr-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <Cpu size={16} />
        Simulated traffic through BroadcastChannel. Open a second tab to watch
        it stay in sync.
      </p>
      <button
        type="button"
        aria-pressed={isRunning()}
        onClick={() => setIsRunning((current) => !current)}
        class={simulationButtonStyles({ running: isRunning() })}
      >
        <Dynamic
          component={isRunning() ? Pause : Play}
          size={14}
          stroke-width={2.5}
        />
        {isRunning() ? "Pause" : "Resume"}
      </button>
      <For each={actions}>
        {(action) => (
          <button
            type="button"
            onClick={() => action.run()}
            class={simulationButtonStyles()}
          >
            <Dynamic component={action.icon} size={14} stroke-width={2.5} />
            {action.label}
          </button>
        )}
      </For>
    </section>
  );
};
