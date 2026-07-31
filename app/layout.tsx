import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { EditorShell } from "@/components/shell/EditorShell";
import { SoundProvider } from "@/components/sound/SoundProvider";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Clarity Lab — Ayse Sule Ekiz",
  description:
    "Ayse Sule Ekiz is a multidisciplinary product builder who moves between engineering, design, data, and visual craft to create polished, working experiences.",
  metadataBase: new URL("https://ayse-sule-ekiz.dev"),
  icons: {
    icon: [{ url: "/images/logos/favicon.png", type: "image/png" }],
    shortcut: [{ url: "/images/logos/favicon.png", type: "image/png" }],
    apple: [{ url: "/images/logos/favicon.png", type: "image/png" }],
  },
  openGraph: {
    title: "The Clarity Lab — Ayse Sule Ekiz",
    description: "I take ideas from concept to polished, working experiences.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <SoundProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
            >
              Skip to content
            </a>
            <EditorShell>{children}</EditorShell>
            <Analytics />
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
