import { cva } from "class-variance-authority";

export const metricCardStyles = cva("min-w-0 rounded-xl border p-4", {
  variants: {
    empty: {
      true: "border-dashed border-zinc-300 dark:border-zinc-700",
      false: "border-zinc-200 dark:border-zinc-800",
    },
  },
});
