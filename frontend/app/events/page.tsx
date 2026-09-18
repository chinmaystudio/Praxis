import type { Metadata } from "next";
import EventsExperience from "@/components/EventsExperience";

export const metadata: Metadata = {
  title: "Events | Praxis",
  description: "Explore Praxis events, challenges, and rulebooks.",
  keywords: ["Praxis", "events", "technology", "culture"],
  openGraph: {
    title: "Events | Praxis",
    description: "Explore Praxis events, challenges, and rulebooks.",
    siteName: "Praxis",
    url: "/events",
    images: [{ url: "/images/praxis-banner.png", alt: "Praxis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events | Praxis",
    description: "Explore Praxis events, challenges, and rulebooks.",
    images: ["/images/praxis-banner.png"],
  },
};

export default function EventsPage() {
  return <EventsExperience />;
}
