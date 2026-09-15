<script setup lang="ts">
import { shallowRef } from "vue";
import { useChannel } from "@priemskiyyy/simulcast-vue";

const props = defineProps<{ channel: string; name: string }>();
const messages = shallowRef<string[]>([]);

useChannel<{ text: string }>(
  () => props.channel,
  (message) => {
    messages.value = [...messages.value, message.text];
  },
);
</script>

<template>
  <output :data-testid="name">{{ JSON.stringify(messages) }}</output>
</template>
