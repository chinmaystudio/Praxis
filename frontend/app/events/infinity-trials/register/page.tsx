import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Register your team · Infinity Trials", description: "Assemble your team of four for the Infinity Trials at Praxis 2026." };
export default function RegistrationPage() { redirect("/events/infinity-trials/closed"); }
