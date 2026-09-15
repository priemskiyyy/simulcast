<script setup lang="ts">
import { PhRocketLaunch } from "@phosphor-icons/vue";
import type { Deploy } from "example-shared";
import DeployPipeline from "src/components/DeployPipeline.vue";
import EmptyState from "src/components/EmptyState.vue";
import Panel from "src/components/Panel.vue";

type DeploysPanelProps = { deploys: Deploy[] };

defineProps<DeploysPanelProps>();
</script>

<template>
  <Panel title="Deploys" :icon="PhRocketLaunch">
    <EmptyState
      v-if="deploys.length === 0"
      :icon="PhRocketLaunch"
      title="Nothing shipping"
      description="deploy.progressed publications move each service through the pipeline."
    />
    <ul v-else class="flex flex-col gap-4">
      <li v-for="deploy in deploys" :key="deploy.service">
        <DeployPipeline :deploy="deploy" />
      </li>
    </ul>
  </Panel>
</template>
