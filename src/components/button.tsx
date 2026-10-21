import Link from "next/link";
import type { ComponentProps } from "react";

/* Botão da marca: borda Ink de 2px e sombra projetada sólida (recurso Techstars) que "afunda" no hover.
   primary = Marigold (uma ação principal por tela); secondary = papel.
   lg nos heros e formulários, md em faixas e painéis, sm (sem sombra) em ações de tabela. */
export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "lg" | "md" | "sm";

const base =
  "inline-flex max-w-full items-center justify-center gap-2 border-2 border-ink text-center font-semibold text-ink " +
  "transition-[translate,box-shadow,background-color,color] duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper dark:text-paper";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-marigold dark:text-ink",
  secondary: "bg-paper dark:bg-ink",
};

const sizes: Record<ButtonSize, string> = {
  lg: "min-h-16 px-6 py-3 text-subheading leading-tight text-balance shadow-hard sm:px-8 not-disabled:hover:translate-x-1.5 not-disabled:hover:translate-y-1.5 not-disabled:hover:shadow-none dark:shadow-hard-paper",
  md: "h-12 whitespace-nowrap px-6 text-body shadow-hard-sm not-disabled:hover:translate-x-1 not-disabled:hover:translate-y-1 not-disabled:hover:shadow-none dark:shadow-hard-paper",
  sm: "h-10 whitespace-nowrap px-4 text-caption not-disabled:hover:bg-ink not-disabled:hover:text-paper dark:not-disabled:hover:bg-paper dark:not-disabled:hover:text-ink",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; className?: string };

export function Button({ variant, size, className = "", type = "button", ...rest }: Common & ComponentProps<"button">) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({ variant, size, className = "", ...rest }: Common & ComponentProps<typeof Link>) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* Link externo (WhatsApp, e-mail) com cara de botão */
export function ButtonAnchor({ variant, size, className = "", ...rest }: Common & ComponentProps<"a">) {
  return <a className={buttonClass(variant, size, className)} {...rest} />;
}
