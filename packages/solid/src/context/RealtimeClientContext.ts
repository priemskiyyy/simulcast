import { createContext } from "solid-js";
import type { Accessor } from "solid-js";
import type { RealtimeClient } from "@priemskiyyy/simulcast";

export const RealtimeClientContext = createContext<Accessor<RealtimeClient>>();
