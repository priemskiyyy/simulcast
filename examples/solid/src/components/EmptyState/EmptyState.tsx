import type { Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Icon } from "src/types/Icon";

type EmptyStateProps = {
  icon: Icon;
  title: string;
  description: string;
};

export const EmptyState: Component<EmptyStateProps> = (props) => (
  <div class="m-auto flex max-w-xs flex-col items-center gap-2 py-8 text-center">
    <Dynamic
      component={props.icon}
      size={28}
      stroke-width={1.25}
      class="text-zinc-400"
    />
    <p class="text-sm font-medium">{props.title}</p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400">{props.description}</p>
  </div>
);
