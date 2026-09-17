import type { Metadata } from "next";
import EventsExperience from "@/components/EventsExperience";

export const metadata: Metadata = {
  title: "Events · AVENGERS: DOOMSDAY",
  description: "Explore the characters of Avengers: Doomsday — an interactive cinematic orbit experience.",
};

export default function EventsPage() {
  return <EventsExperience />;
}
