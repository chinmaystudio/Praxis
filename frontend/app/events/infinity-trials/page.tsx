import type { Metadata } from "next";
import InfinityTrialsPage from "@/components/infinity-trials/InfinityTrialsPage";
import InfinityTrialsEntry from "@/components/infinity-trials/InfinityTrialsEntry";

export const metadata: Metadata = {
  title: "The Infinity Trials · Praxis 2026",
  description:
    "Three trials, six stones and one ultimate champion. Join The Infinity Trials at PCCOE on 9-10 October 2026.",
};

export default async function InfinityTrialsRoute({ searchParams }: { searchParams: Promise<{ intro?: string }> }) {
  const { intro } = await searchParams;
  return <InfinityTrialsEntry playIntro={intro === "1"}><InfinityTrialsPage /></InfinityTrialsEntry>;
}
