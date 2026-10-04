import type { Metadata } from "next";
import GalleryExperience from "@/components/gallery/GalleryExperience";

export const metadata: Metadata = {
  title: "Gallery | PRAXIS 2026",
  description: "Explore the Praxis photo gallery. Relive the people, the events, and the moments in an interactive photo collection.",
};

export default function GalleryPage() {
  return <GalleryExperience />;
}
