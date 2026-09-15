<script setup lang="ts">
import AlertRow from "src/components/AlertRow.vue";
import { PhBell, PhShieldCheck } from "@phosphor-icons/vue";
import type { Alert } from "example-shared";
import { useNow } from "src/composables/useNow";
import Badge from "src/components/Badge.vue";
import EmptyState from "src/components/EmptyState.vue";
import Panel from "src/components/Panel.vue";

type AlertsPanelProps = { alerts: Alert[] };

defineProps<AlertsPanelProps>();
const now = useNow(15_000);
</script>

<template>
  <Panel title="Alerts" :icon="PhBell">
    <template #aside>
      <Badge :tone="alerts.length > 0 ? 'warning' : 'positive'"
        >{{ alerts.length }} open</Badge
      >
    </template>
    <ul v-if="alerts.length > 0" class="flex flex-col gap-2">
      <AlertRow
        v-for="alert in alerts"
        :key="alert.id"
        :alert="alert"
        :now="now"
      />
    </ul>
    <EmptyState
      v-else
      :icon="PhShieldCheck"
      title="All clear"
      description="alert.raised publications stay here until alert.resolved arrives."
    />
  </Panel>
</template>
