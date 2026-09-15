import type { DecodedEvent, RealtimePublication } from "@priemskiyyy/simulcast";
import { z } from "zod";

const envelopeSchema = z.object({ name: z.string(), body: z.unknown() });

/** Reads the `{ name, body }` envelope out of a publication; anything else is not an event. */
export const decodeEnvelope = ({
  data,
}: RealtimePublication): DecodedEvent | null => {
  const parsed = envelopeSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return { eventType: parsed.data.name, payload: parsed.data.body };
};
