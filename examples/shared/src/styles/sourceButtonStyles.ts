import { cva } from "class-variance-authority";

export const sourceButtonStyles = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
  {
    variants: {
      selected: {
        true: "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100",
        false:
          "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      },
    },
  },
);
