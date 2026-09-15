<script setup lang="ts">
import { sourceButtonStyles } from "example-shared/styles/sourceButtonStyles";
import { PhBroadcast, PhCpu } from "@phosphor-icons/vue";
import type { RealtimeSource } from "example-shared";

const sourceType = defineModel<RealtimeSource["type"]>({ required: true });

const OPTIONS = [
  { type: "SIMULATION", label: "Simulation", icon: PhCpu },
  { type: "CENTRIFUGO", label: "Centrifugo", icon: PhBroadcast },
] as const;
</script>

<template>
  <div
    role="group"
    aria-label="Realtime source"
    class="inline-flex rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800"
  >
    <button
      v-for="option in OPTIONS"
      :key="option.type"
      type="button"
      :aria-pressed="sourceType === option.type"
      :class="sourceButtonStyles({ selected: sourceType === option.type })"
      @click="sourceType = option.type"
    >
      <component :is="option.icon" :size="14" weight="bold" />
      {{ option.label }}
    </button>
  </div>
</template>
