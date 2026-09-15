<script setup lang="ts">
import { PhCircleNotch, PhPlugs, PhPlugsConnected } from "@phosphor-icons/vue";
import { formatConnectionState, getConnectionTone } from "example-shared";
import { useConnectionState } from "@priemskiyyy/simulcast-vue";
import { match } from "ts-pattern";
import { computed } from "vue";
import Badge from "src/components/Badge.vue";

const connection = useConnectionState();
const icon = computed(() =>
  match(connection.value)
    .with("connected", () => PhPlugsConnected)
    .with("connecting", () => PhCircleNotch)
    .with("disconnected", () => PhPlugs)
    .exhaustive(),
);
</script>

<template>
  <Badge :tone="getConnectionTone(connection)" :icon="icon">
    {{ formatConnectionState(connection) }}
  </Badge>
</template>
