<script lang="ts">
  import { simulationButtonStyles } from "example-shared/styles/simulationButtonStyles";
  import { createBroadcastPublisher, createSimulation } from "example-shared";
  import {
    Bell,
    ChartLineUp,
    Cpu,
    PaperPlaneTilt,
    Pause,
    Play,
    RocketLaunch,
  } from "phosphor-svelte";
  import { untrack } from "svelte";

  type SimulationControlsProps = { roomId: string };

  let { roomId }: SimulationControlsProps = $props();

  // Owns the in-page simulation: it publishes through BroadcastChannel, so every tab on this origin receives the traffic.
  const publisher = createBroadcastPublisher();
  // The simulation starts in the current room and follows later changes through the effect below.
  const simulation = createSimulation({
    publish: publisher.publish,
    roomId: untrack(() => roomId),
  });
  let isRunning = $state(true);

  $effect(() => simulation.setRoom(roomId));
  $effect(() => {
    if (!isRunning) {
      simulation.stop();
      return;
    }

    simulation.start();
  });
  $effect(() => () => {
    simulation.stop();
    publisher.close();
  });

  const ACTIONS = [
    {
      label: "Send message",
      icon: PaperPlaneTilt,
      run: simulation.sendMessage,
    },
    {
      label: "Report metrics",
      icon: ChartLineUp,
      run: simulation.reportMetrics,
    },
    { label: "Raise alert", icon: Bell, run: simulation.raiseAlert },
    {
      label: "Advance deploy",
      icon: RocketLaunch,
      run: simulation.advanceDeploy,
    },
  ];
</script>

<section
  aria-label="Simulation"
  class="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
>
  <p
    class="mr-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
  >
    <Cpu size={16} weight="duotone" />
    Simulated traffic through BroadcastChannel. Open a second tab to watch it stay
    in sync.
  </p>
  <button
    type="button"
    aria-pressed={isRunning}
    class={simulationButtonStyles({ running: isRunning })}
    onclick={() => (isRunning = !isRunning)}
  >
    {#if isRunning}
      <Pause size={14} weight="bold" />
    {:else}
      <Play size={14} weight="bold" />
    {/if}
    {isRunning ? "Pause" : "Resume"}
  </button>
  {#each ACTIONS as action (action.label)}
    {@const ActionIcon = action.icon}
    <button
      type="button"
      class={simulationButtonStyles()}
      onclick={() => action.run()}
    >
      <ActionIcon size={14} weight="bold" />
      {action.label}
    </button>
  {/each}
</section>
