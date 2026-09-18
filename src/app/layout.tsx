import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
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

const title = `${site.name} | ${site.cityName}, ${site.dateShort}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.shortName}`,
  },
  description: site.seoDescription,
  keywords: site.keywords,
  authors: [{ name: site.shortName, url: site.url }],
  creator: "Comunidade Techstars Startup Weekend em Goiás",
  publisher: site.organizer,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.shortName,
    locale: "pt_BR",
    title,
    description: site.seoDescription,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.seoDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "events",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">{children}</body>
      <GoogleAnalytics gaId={site.gaId} />
    </html>
  );
}
