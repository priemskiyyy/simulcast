<script setup lang="ts">
import { computed, shallowRef } from "vue";
import {
  useChannelStatus,
  useConnectionState,
} from "@priemskiyyy/simulcast-vue";
import Consumer from "./Consumer.vue";

const props = defineProps<{ user: string }>();
const channel = computed(() => `private:${props.user}`);
const first = shallowRef(true);
const second = shallowRef(true);
const connection = useConnectionState();
const status = useChannelStatus(channel);
</script>

<template>
  <section>
    <output data-testid="connection">{{ connection }}</output>
    <output data-testid="channel">{{ status.state }}</output>
    <label><input type="checkbox" v-model="first" />First consumer</label>
    <label><input type="checkbox" v-model="second" />Second consumer</label>
    <Consumer v-if="first" :channel="channel" name="first" />
    <Consumer v-if="second" :channel="channel" name="second" />
  </section>
</template>
