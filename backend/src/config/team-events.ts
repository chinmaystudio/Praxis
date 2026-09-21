export type TeamPricing =
  | { kind: "external-team"; amount: number }
  | { kind: "external-member"; amount: number };

export type TeamEventPolicy = {
  slug: string;
  title: string;
  minMembers: number;
  maxMembers: number;
  pricing: TeamPricing;
};

export const TEAM_EVENT_POLICIES: Record<string, TeamEventPolicy> = {
  "infinity-trials": {
    slug: "infinity-trials",
    title: "Infinity Trials",
    minMembers: 4,
    maxMembers: 4,
    pricing: { kind: "external-team", amount: 200 },
  },
  "bgmi-elite-showdown": {
    slug: "bgmi-elite-showdown",
    title: "BGMI Elite Showdown",
    minMembers: 2,
    maxMembers: 4,
    pricing: { kind: "external-member", amount: 50 },
  },
  "research-x": {
    slug: "research-x",
    title: "Research X",
    minMembers: 2,
    maxMembers: 4,
    pricing: { kind: "external-member", amount: 50 },
  },
};

export const PCCOE_EMAIL_DOMAINS = (process.env.PCCOE_EMAIL_DOMAINS || "pccoepune.org")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export function isPccoeEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] || "";
  return PCCOE_EMAIL_DOMAINS.includes(domain);
}

export function teamAmount(policy: TeamEventPolicy, emails: string[]): number {
  const externalCount = emails.filter((email) => !isPccoeEmail(email)).length;
  return policy.pricing.kind === "external-team"
    ? externalCount > 0 ? policy.pricing.amount : 0
    : externalCount * policy.pricing.amount;
}
