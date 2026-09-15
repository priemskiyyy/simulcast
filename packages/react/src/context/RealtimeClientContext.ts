import { createContext } from "react";
import type { RealtimeClient } from "simulcast";

export const RealtimeClientContext = createContext<RealtimeClient | undefined>(
  undefined,
);
