import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: `Seja voluntário | ${site.shortName}`,
  description: site.description,
  openGraph: {
    title: `Seja voluntário | ${site.shortName}`,
    description: site.tagline,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
