<script setup lang="ts">
import { simulationButtonStyles } from "example-shared/styles/simulationButtonStyles";
import {
  PhBell,
  PhChartLineUp,
  PhCpu,
  PhPaperPlaneTilt,
  PhPause,
  PhPlay,
  PhRocketLaunch,
} from "@phosphor-icons/vue";
import { createBroadcastPublisher, createSimulation } from "example-shared";
import { onUnmounted, shallowRef, watch, watchEffect } from "vue";

type SimulationControlsProps = { roomId: string };

const props = defineProps<SimulationControlsProps>();

// Owns the in-page simulation: it publishes through BroadcastChannel, so every tab on this origin receives the traffic.
const publisher = createBroadcastPublisher();
const simulation = createSimulation({
  publish: publisher.publish,
  roomId: props.roomId,
});
const isRunning = shallowRef(true);

watch(() => props.roomId, simulation.setRoom);
watchEffect(() => {
  if (!isRunning.value) {
    simulation.stop();
    return;
  }

  simulation.start();
});
onUnmounted(() => {
  simulation.stop();
  publisher.close();
});

const ACTIONS = [
  {
    label: "Send message",
    icon: PhPaperPlaneTilt,
    run: simulation.sendMessage,
  },
  {
    label: "Report metrics",
    icon: PhChartLineUp,
    run: simulation.reportMetrics,
  },
  { label: "Raise alert", icon: PhBell, run: simulation.raiseAlert },
  {
    label: "Advance deploy",
    icon: PhRocketLaunch,
    run: simulation.advanceDeploy,
  },
];
</script>

<template>
  <section
    aria-label="Simulation"
    class="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
  >
    <p
      class="mr-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
    >
      <PhCpu :size="16" weight="duotone" />
      Simulated traffic through BroadcastChannel. Open a second tab to watch it
      stay in sync.
    </p>
    <button
      type="button"
      :aria-pressed="isRunning"
      :class="simulationButtonStyles({ running: isRunning })"
      @click="isRunning = !isRunning"
    >
      <PhPause v-if="isRunning" :size="14" weight="bold" />
      <PhPlay v-else :size="14" weight="bold" />
      {{ isRunning ? "Pause" : "Resume" }}
    </button>
    <button
      v-for="action in ACTIONS"
      :key="action.label"
      type="button"
      :class="simulationButtonStyles()"
      @click="action.run()"
    >
      <component :is="action.icon" :size="14" weight="bold" />
      {{ action.label }}
    </button>
  </section>
</template>
