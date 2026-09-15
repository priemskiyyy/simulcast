import type React from "react";
import { badgeStyles } from "example-shared/styles/badgeStyles";
import type { Icon } from "@phosphor-icons/react";
import type { Tone } from "example-shared";
import type { ReactNode } from "react";

type BadgeProps = {
  tone: Tone;
  icon?: Icon;
  children: ReactNode;
};

export const Badge: React.FunctionComponent<BadgeProps> = ({
  tone,
  icon: BadgeIcon,
  children,
}) => (
  <span className={badgeStyles({ tone: tone })}>
    {BadgeIcon === undefined ? null : <BadgeIcon size={13} weight="bold" />}
    {children}
  </span>
);
