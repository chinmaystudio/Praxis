export type TeamPricing =
  | { kind: "external-team"; amount: number }
  | { kind: "external-member"; amount: number }
  | { kind: "fixed-team"; amount: number };

export type TeamEventPolicy = {
  slug: string;
  title: string;
  minMembers: number;
  maxMembers: number;
  pricing: TeamPricing;
  whatsappUrl?: string;
};

export const TEAM_EVENT_POLICIES: Record<string, TeamEventPolicy> = {
  "infinity-trials": {
    slug: "infinity-trials",
    title: "Infinity Trials",
    minMembers: 4,
    maxMembers: 4,
    pricing: { kind: "external-team", amount: 200 },
    whatsappUrl: "https://chat.whatsapp.com/CRBxGduw0U8GG3x591hz8Q?s=qt&p=i&mlu=4&ilr=4",
  },
  "bgmi-elite-showdown": {
    slug: "bgmi-elite-showdown",
    title: "BGMI Elite Showdown",
    minMembers: 2,
    maxMembers: 4,
    pricing: { kind: "external-member", amount: 50 },
    whatsappUrl: "https://chat.whatsapp.com/IClctDsmKyaEHnaE3E1WXk?s=cl&p=a&mlu=0&ilr=4",
  },
  "research-x": {
    slug: "research-x",
    title: "Research X",
    minMembers: 2,
    maxMembers: 4,
    pricing: { kind: "external-member", amount: 50 },
    whatsappUrl: "https://chat.whatsapp.com/GJtulaML6tx24r9JKpQ1MC",
  },
  "tech-roulette": {
    slug: "tech-roulette",
    title: "Tech Roulette",
    minMembers: 2,
    maxMembers: 3,
    pricing: { kind: "fixed-team", amount: 49 },
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
  if (policy.pricing.kind === "fixed-team") return policy.pricing.amount;
  const externalCount = emails.filter((email) => !isPccoeEmail(email)).length;
  return policy.pricing.kind === "external-team"
    ? externalCount > 0 ? policy.pricing.amount : 0
    : externalCount * policy.pricing.amount;
}
