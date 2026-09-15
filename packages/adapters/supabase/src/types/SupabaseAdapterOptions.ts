import type {
  RealtimeChannelOptions,
  RealtimeClientOptions,
} from "@supabase/realtime-js";

export type SupabaseAdapterOptions = {
  /** The realtime endpoint, such as `wss://<project>.supabase.co/realtime/v1`. */
  url: string;
  options?: RealtimeClientOptions;
  /** Per-channel options, such as `config.private` or presence settings. */
  getChannelOptions?: (channel: string) => RealtimeChannelOptions;
};
