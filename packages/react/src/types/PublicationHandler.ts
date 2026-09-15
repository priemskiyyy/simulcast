import type { RealtimePublication } from "@priemskiyyy/simulcast";

export type PublicationHandler<TData> = (
  data: TData,
  publication: RealtimePublication,
) => void | Promise<unknown>;
