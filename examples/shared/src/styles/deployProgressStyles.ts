import { cva } from "class-variance-authority";

export const deployProgressStyles = cva(
  "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
  { variants: { done: { true: "bg-emerald-500", false: "bg-sky-500" } } },
);
