import type { Component } from "solid-js";
import { badgeStyles } from "example-shared/styles/badgeStyles";
import type { Tone } from "example-shared";
import { Show } from "solid-js";
import type { ParentProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Icon } from "src/types/Icon";

type BadgeProps = ParentProps<{
  tone: Tone;
  icon?: Icon;
}>;

export const Badge: Component<BadgeProps> = (props) => (
  <span class={badgeStyles({ tone: props.tone })}>
    <Show when={props.icon}>
      {(icon) => <Dynamic component={icon()} size={13} stroke-width={2.5} />}
    </Show>
    {props.children}
  </span>
);
