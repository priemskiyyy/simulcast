import type { Component } from "solid-js";
import type { JSX, ParentProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Icon } from "src/types/Icon";

type PanelProps = ParentProps<{
  title: string;
  icon: Icon;
  /** Right-aligned header content, such as a count or a status badge. */
  aside?: JSX.Element;
}>;

export const Panel: Component<PanelProps> = (props) => (
  <section
    aria-label={props.title}
    class="flex min-h-72 flex-col rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
  >
    <header class="mb-4 flex items-center gap-2">
      <Dynamic
        component={props.icon}
        size={18}
        class="text-emerald-600 dark:text-emerald-400"
      />
      <h2 class="text-sm font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400">
        {props.title}
      </h2>
      <div class="ml-auto flex items-center gap-2">{props.aside}</div>
    </header>
    {props.children}
  </section>
);
