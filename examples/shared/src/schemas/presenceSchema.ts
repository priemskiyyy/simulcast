import { z } from "zod";

export const presenceSchema = z.object({
  online: z.number().int().nonnegative(),
});

export type Presence = z.infer<typeof presenceSchema>;
