import { z } from "zod";

export const alertResolutionSchema = z.object({
  id: z.string(),
});

export type AlertResolution = z.infer<typeof alertResolutionSchema>;
