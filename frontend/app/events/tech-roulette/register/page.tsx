import type { Metadata } from "next";
import TechRegistration from "@/components/tech-roulette/TechRegistration";

export const metadata: Metadata = {
  title: "Register for Tech Roulette · Praxis 2026",
  description: "Register for Tech Roulette at Praxis 2026.",
  robots: { index: false, follow: false },
};

export default function TechRouletteRegistrationPage() {
  return <TechRegistration />;
}
