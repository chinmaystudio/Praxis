export type TeamEventPolicy = {
  slug: string;
  title: string;
  minMembers: number;
  maxMembers: number;
  rulebook: string;
  accent: string;
  externalPricing: "team" | "member";
  externalAmount: number;
};

export const TEAM_EVENTS: Record<string, TeamEventPolicy> = {
  "infinity-trials": { slug: "infinity-trials", title: "Infinity Trials", minMembers: 4, maxMembers: 4, rulebook: "/rulebooks/infinity-trials.pdf", accent: "#dcb77b", externalPricing: "team", externalAmount: 200 },
  "bgmi-elite-showdown": { slug: "bgmi-elite-showdown", title: "BGMI Elite Showdown", minMembers: 2, maxMembers: 4, rulebook: "/rulebooks/bgmi-elite-showdown-rulebook.pdf", accent: "#ff4458", externalPricing: "member", externalAmount: 50 },
  "research-x": { slug: "research-x", title: "Research X", minMembers: 2, maxMembers: 4, rulebook: "/rulebooks/research-x-rulebook.pdf", accent: "#64e7ff", externalPricing: "member", externalAmount: 50 },
};

export const isPccoeEmail = (email: string) => email.trim().toLowerCase().endsWith("@pccoepune.org");
export function payableAmount(policy: TeamEventPolicy, emails: string[]) {
  const external = emails.filter((email) => email && !isPccoeEmail(email)).length;
  return policy.externalPricing === "team" ? external ? policy.externalAmount : 0 : external * policy.externalAmount;
}
