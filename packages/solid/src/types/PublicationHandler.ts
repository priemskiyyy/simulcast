import type { RealtimePublication } from "simulcast";

export type PublicationHandler<TData> = (
  data: TData,
  publication: RealtimePublication,
) => void | Promise<unknown>;
