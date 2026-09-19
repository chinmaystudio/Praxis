/**
 * PRAXIS BACKEND — Central Event Configuration
 * Single source of truth for server-side pricing and specs.
 */

export interface EventConfig {
  slug: string;
  title: string;
  theme: string;
  desc: string;
  image: string;
  rulebook: string;
  downloadName: string;
  accent: string;
  price: number; // in INR
  currency: "INR";
  registrationOpen: boolean;
  isTeamEvent?: boolean;
  maxTeamSize?: number;
}

export const EVENTS: EventConfig[] = [
  {
    slug: "infinity-trials",
    title: "Infinity Trials",
    theme: "Infinity War",
    desc: "Face a cosmic challenge where strategy, speed, and teamwork decide who is worthy of the stones.",
    image: "/events/infinity-trials.png",
    rulebook: "/rulebooks/infinity-trials-rulebook.pdf",
    downloadName: "Infinity-Trials-Rulebook.pdf",
    accent: "#f2b84b",
    price: 99,
    currency: "INR",
    registrationOpen: true,
    isTeamEvent: true,
    maxTeamSize: 4,
  },
  {
    slug: "research-x",
    title: "Research X",
    theme: "Thor",
    desc: "Channel thunderous ideas into a sharp research showcase built around insight, evidence, and impact.",
    image: "/events/research-x.png",
    rulebook: "/rulebooks/research-x-rulebook.pdf",
    downloadName: "Research-X-Rulebook.pdf",
    accent: "#65cfff",
    price: 149,
    currency: "INR",
    registrationOpen: true,
    isTeamEvent: false,
  },
  {
    slug: "bgmi-elite-showdown",
    title: "BGMI Elite Showdown",
    theme: "Captain America",
    desc: "Enter the battleground with disciplined teamwork, tactical precision, and the resolve to hold the line.",
    image: "/events/bgmi-elite-showdown.png",
    rulebook: "/rulebooks/bgmi-elite-showdown-rulebook.pdf",
    downloadName: "BGMI-Elite-Showdown-Rulebook.pdf",
    accent: "#ff4458",
    price: 199,
    currency: "INR",
    registrationOpen: true,
    isTeamEvent: true,
    maxTeamSize: 4,
  },
  {
    slug: "tech-roulette",
    title: "Tech Roulette",
    theme: "Iron Man",
    desc: "A three-round technical showdown combining sustainability knowledge, rapid prototyping, and high-pressure solution pitching.",
    image: "/events/tech-roulette.png",
    rulebook: "/rulebooks/tech-roulette-rulebook.docx",
    downloadName: "Tech-Roulette-Rulebook.docx",
    accent: "#35d9ff",
    price: 49,
    currency: "INR",
    registrationOpen: true,
    isTeamEvent: false,
  },
  {
    slug: "storyverse",
    title: "StoryVerse",
    theme: "Doctor Strange Multiverse",
    desc: "Transform an AI-generated story video into an interactive browser game across two connected creative rounds.",
    image: "/events/storyverse.png",
    rulebook: "/rulebooks/storyverse-rulebook.docx",
    downloadName: "StoryVerse-Rulebook.docx",
    accent: "#ff9f3f",
    price: 79,
    currency: "INR",
    registrationOpen: true,
    isTeamEvent: false,
  },
];

export function getEventBySlug(slug: string): EventConfig | undefined {
  return EVENTS.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}

export function formatPrice(price: number, currency: "INR" = "INR"): string {
  if (currency === "INR") {
    return `₹${price}`;
  }
  return `${currency} ${price}`;
}
