import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "The Infinity Trials · Praxis 2026",
  description:
    "Three trials, six stones and one ultimate champion. Join The Infinity Trials at PCCOE on 9-10 October 2026.",
};

export default function InfinityTrialsRoute() {
  redirect("/events/infinity-trials/closed");
}
