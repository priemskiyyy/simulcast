import { createContext } from "react";
import type { RealtimeClient } from "@priemskiyyy/simulcast";

export const RealtimeClientContext = createContext<RealtimeClient | undefined>(
  undefined,
);
