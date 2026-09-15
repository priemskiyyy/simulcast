import { cva } from "class-variance-authority";

export const simulationButtonStyles = cva(
  "inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
  {
    variants: {
      running: {
        true: "border-emerald-500/50 text-emerald-700 dark:text-emerald-300",
        false: "border-zinc-300 dark:border-zinc-700",
      },
    },
    defaultVariants: { running: false },
  },
);
