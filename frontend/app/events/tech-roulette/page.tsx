import type { Metadata } from "next";
import TechRoulettePage from "@/components/tech-roulette/TechRoulettePage";

export const metadata: Metadata = {
  title: "Tech Roulette · The Innovation Protocol · Praxis 2026",
  description: "Innovate for tomorrow. A three-round sustainability challenge: quiz, build and pitch. Explore Tech Roulette at Praxis, PCCOE Pune.",
  alternates: { canonical: "/events/tech-roulette" },
  openGraph: {
    title: "Tech Roulette · Praxis 2026",
    description: "Three rounds. One mission. Innovate for tomorrow.",
    url: "/events/tech-roulette",
    images: [{ url: "/tech-roulette/iron-workshop.webp", width: 1672, height: 941, alt: "Tech Roulette reactor workshop" }],
  },
};

export default function TechRouletteRoute() { return <TechRoulettePage />; }
