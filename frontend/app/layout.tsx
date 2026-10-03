import type { Metadata, Viewport } from "next";
import { Anton, Chakra_Petch } from "next/font/google";
import Script from "next/script";
import BackgroundMusic from "@/components/ui/BackgroundMusic";
import "./globals.css";

// Impact display face for the giant titles.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

// Sci-fi HUD face for kickers, labels and UI.
const chakra = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL to your deployed URL so link previews resolve the
// social image correctly. Falls back to a sensible default otherwise.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://praxis26.in";
const description =
  "PRAXIS 2026 at PCCOE Pune. Explore Infinity Trials, BGMI Elite Showdown, Research X and more. Assemble your team and register.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PRAXIS 2026 — PCCOE Pune",
  description,
  keywords: ["Praxis 2026", "PCCOE Pune", "Infinity Trials", "BGMI", "Research X"],
  icons: {
    icon: [
      { url: "/praxis-icon-v5-16.png", sizes: "16x16", type: "image/png" },
      { url: "/praxis-icon-v5-32.png", sizes: "32x32", type: "image/png" },
      { url: "/praxis-icon-v5-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/praxis-icon-v5-32.png",
    apple: { url: "/praxis-apple-v5.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "PRAXIS 2026 — PCCOE Pune",
    description,
    url: siteUrl,
    siteName: "PRAXIS 2026",
    type: "website",
    images: [{ url: "/images/praxis_new_logo.png", width: 2048, height: 683, alt: "PRAXIS 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAXIS 2026 — PCCOE Pune",
    description,
    images: ["/images/praxis_new_logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${chakra.variable}`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4709003814028430"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes on <body> before React hydrates — harmless, not our markup. */}
      <body suppressHydrationWarning>
        {children}
        <BackgroundMusic />
      </body>
    </html>
  );
}
