import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: "400",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: `Seja voluntário | ${site.name}`,
  description: site.description,
  openGraph: {
    title: `Seja voluntário | ${site.name}`,
    description: site.tagline,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
