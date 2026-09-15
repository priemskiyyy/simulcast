<script setup lang="ts">
import {
  initialApplicationState,
  createRealtimeClient,
  resolveSource,
} from "example-shared";
import { SimulcastDevtools } from "@priemskiyyy/simulcast-devtools/vue";
import { RealtimeProvider } from "@priemskiyyy/simulcast-vue";
import { computed, reactive } from "vue";
import Dashboard from "src/components/Dashboard.vue";
import Header from "src/components/Header.vue";
import SimulationControls from "src/components/SimulationControls.vue";

const state = reactive({ ...initialApplicationState });
// The adapter captures its endpoint, so the client changes exactly when the source does.
const client = computed(() =>
  createRealtimeClient(
    resolveSource({ sourceType: state.sourceType, endpoint: state.endpoint }),
  ),
);
const isDevelopment = import.meta.env.DEV;
</script>

<template>
  <RealtimeProvider :client="client" :session="{ enabled: state.enabled }">
    <Header
      v-model:source-type="state.sourceType"
      v-model:endpoint="state.endpoint"
      v-model:room-id="state.roomId"
      :enabled="state.enabled"
      @session-toggle="state.enabled = !state.enabled"
    />
    <main class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <SimulationControls
        v-if="state.sourceType === 'SIMULATION'"
        :room-id="state.roomId"
      />
      <Dashboard :key="state.roomId" :room-id="state.roomId" />
    </main>
    <SimulcastDevtools v-if="isDevelopment" />
  </RealtimeProvider>
</template>
