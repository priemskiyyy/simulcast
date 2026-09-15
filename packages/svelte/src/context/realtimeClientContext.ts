import { getContext, setContext } from "svelte";
import type { RealtimeClient } from "simulcast";
import type { ReadableBox } from "../types/ReadableBox.js";

const REALTIME_CLIENT_KEY = Symbol("simulcast client");

export const setRealtimeClient = (client: ReadableBox<RealtimeClient>) => {
  setContext(REALTIME_CLIENT_KEY, client);
};

export const getRealtimeClient = () =>
  getContext<ReadableBox<RealtimeClient> | undefined>(REALTIME_CLIENT_KEY);
