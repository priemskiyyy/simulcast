import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  author: z.string().min(1),
  text: z.string().min(1),
  sentAt: z.iso.datetime(),
});

export type Message = z.infer<typeof messageSchema>;
