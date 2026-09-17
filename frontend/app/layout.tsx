import type { Metadata, Viewport } from "next";
import { Anton, Chakra_Petch } from "next/font/google";
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
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avengers-doomsday.vercel.app";
const description =
  "An Awwwards-style, fully scroll-driven cinematic web experience — the multiverse is breaking, only legends remain. Built with Next.js, React Three Fiber and GSAP. A Marvel-inspired fan concept.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AVENGERS: DOOMSDAY — Cinematic Scroll Experience",
  description,
  keywords: [
    "Avengers",
    "Doomsday",
    "Marvel",
    "cinematic website",
    "scroll experience",
    "Next.js",
    "React Three Fiber",
    "Three.js",
    "GSAP",
    "WebGL",
    "creative development",
  ],
  openGraph: {
    title: "AVENGERS: DOOMSDAY — Cinematic Scroll Experience",
    description,
    url: siteUrl,
    siteName: "AVENGERS: DOOMSDAY",
    type: "website",
    images: [{ url: "/videos/title-reveal-poster.jpg", width: 1180, height: 486, alt: "AVENGERS: DOOMSDAY" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVENGERS: DOOMSDAY — Cinematic Scroll Experience",
    description,
    images: ["/videos/title-reveal-poster.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${chakra.variable}`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes on <body> before React hydrates — harmless, not our markup. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
