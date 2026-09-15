import { z } from "zod";

const errorSchema = z.object({
  message: z.string(),
  code: z.number().optional(),
});

// Centrifugo wraps the failure inside an error context; other providers throw it directly.
const errorContextSchema = z.object({ error: errorSchema });

const withCode = (text: string, code: number | undefined) =>
  code === undefined || code === 0 ? text : `${text} (${code})`;

/** One-line text for a provider error, or a generic label when its shape is unknown. */
export const formatErrorSummary = (error: unknown) => {
  const direct = errorSchema.safeParse(error);

  if (direct.success) {
    return withCode(direct.data.message, direct.data.code);
  }

  const wrapped = errorContextSchema.safeParse(error);

  if (wrapped.success) {
    return withCode(wrapped.data.error.message, wrapped.data.error.code);
  }

  return "Unknown error";
};
