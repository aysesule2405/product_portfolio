import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { EditorShell } from "@/components/shell/EditorShell";

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
    "Ayse Sule Ekiz designs the human layer of complex systems — product design and design engineering across AI tools, learning platforms, data-heavy workflows, and emotional UX.",
  metadataBase: new URL("https://ayse-sule-ekiz.dev"),
  icons: {
    icon: [{ url: "/images/logos/favicon.png", type: "image/png" }],
    shortcut: [{ url: "/images/logos/favicon.png", type: "image/png" }],
    apple: [{ url: "/images/logos/favicon.png", type: "image/png" }],
  },
  openGraph: {
    title: "The Clarity Lab — Ayse Sule Ekiz",
    description: "I design the human layer of complex systems.",
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
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
          >
            Skip to content
          </a>
          <EditorShell>{children}</EditorShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
