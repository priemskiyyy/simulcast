import { createContext } from "solid-js";
import type { Accessor } from "solid-js";
import type { RealtimeClient } from "simulcast";

export const RealtimeClientContext = createContext<Accessor<RealtimeClient>>();
