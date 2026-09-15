<script setup lang="ts">
import { deployProgressStyles } from "example-shared/styles/deployProgressStyles";
import { DEPLOY_STAGES, formatStage, getStageIndex } from "example-shared";
import type { Deploy, DeployStage } from "example-shared";
import { computed } from "vue";

type DeployPipelineProps = { deploy: Deploy };

const props = defineProps<DeployPipelineProps>();
const currentIndex = computed(() => getStageIndex(props.deploy.stage));

const isDone = (stage: DeployStage) =>
  getStageIndex(stage) < currentIndex.value || props.deploy.stage === "LIVE";
const widthFor = (stage: DeployStage) => {
  if (isDone(stage)) {
    return 100;
  }

  if (stage === props.deploy.stage) {
    return props.deploy.percent;
  }

  return 0;
};
</script>

<template>
  <div>
    <p class="mb-2 flex items-baseline justify-between text-sm">
      <span class="font-mono font-medium">{{ deploy.service }}</span>
      <span class="text-xs text-zinc-500 dark:text-zinc-400">
        {{ formatStage(deploy.stage) }} · {{ deploy.percent }}%
      </span>
    </p>
    <ol
      class="grid grid-cols-4 gap-1.5"
      :aria-label="`${deploy.service} pipeline`"
    >
      <li
        v-for="stage in DEPLOY_STAGES"
        :key="stage"
        :aria-current="stage === deploy.stage ? 'step' : undefined"
      >
        <div
          class="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        >
          <div
            :class="deployProgressStyles({ done: isDone(stage) })"
            :style="{ width: `${widthFor(stage)}%` }"
          />
        </div>
        <span
          class="mt-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500"
        >
          {{ formatStage(stage) }}
        </span>
      </li>
    </ol>
  </div>
</template>
