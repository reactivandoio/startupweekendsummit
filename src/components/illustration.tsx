"use client";

import Image, { type ImageProps } from "next/image";
import { useTheme } from "@/components/theme";
import type { Illustration } from "@/content/illustrations";

type Props = Omit<ImageProps, "src" | "alt" | "width" | "height"> & { of: Illustration; alt?: string };

/* <Image> de uma ilustração da marca que troca de arquivo com o tema (content/illustrations.ts).
   O tema inicial vem do servidor, então o HTML já sai com o arquivo certo. */
export function Illustration({ of, alt = of.alt, fill, ...rest }: Props) {
  const { theme } = useTheme();
  const src = theme === "dark" ? of.dark : of.src;
  if (fill) return <Image src={src} alt={alt} fill {...rest} />;
  return <Image src={src} alt={alt} width={of.width} height={of.height} {...rest} />;
}
