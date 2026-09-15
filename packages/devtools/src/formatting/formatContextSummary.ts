import { z } from "zod";
import { formatErrorSummary } from "src/formatting/formatErrorSummary";

// State events carry a bare string. Everything else is an object; only these fields are summarized.
const contextSchema = z.union([
  z.string(),
  z.object({
    event: z.string().optional(),
    error: z.unknown().optional(),
    data: z.unknown().optional(),
    id: z.union([z.string(), z.number()]).optional(),
  }),
]);

/** One-line row text. `value` is the inspected copy of the context. */
export const formatContextSummary = (
  value: unknown,
  capturePayloads: boolean,
) => {
  const parsed = contextSchema.safeParse(value);

  if (!parsed.success) {
    return "";
  }

  const context = parsed.data;

  if (typeof context === "string") {
    return context;
  }

  const parts: string[] = [];

  if (context.event !== undefined) {
    parts.push(context.event);
  }

  if (context.error !== undefined) {
    parts.push(formatErrorSummary(context.error));
  }

  if (context.data !== undefined && capturePayloads) {
    parts.push(String(JSON.stringify(context.data)).slice(0, 100));
  }

  if (context.id !== undefined) {
    parts.push(String(context.id));
  }

  return parts.join(" · ");
};
