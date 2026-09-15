import { cva } from "class-variance-authority";

export const sessionButtonStyles = cva(
  "h-9 rounded-lg px-4 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
  {
    variants: {
      enabled: {
        true: "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
        false: "bg-emerald-600 text-white hover:bg-emerald-500",
      },
    },
  },
);
