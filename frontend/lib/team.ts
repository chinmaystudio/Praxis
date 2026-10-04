import { INFINITY_TRIALS } from "./infinity-trials";

export type CommitteeMember = { name: string; role: string };
export type CommitteeGroup = { title: string; members: CommitteeMember[] };

// Source: PRAXIS Committee.pdf (Mobile Devices copy), page 1.
// Preserve the source's TY/SY POC assignments and name spellings.
export const COMMITTEE: CommitteeGroup[] = [
  { title: "Coordination", members: [
    { name: "Mandar Patil", role: "TY POC" },
    { name: "Sharvil Patil", role: "TY POC" },
    { name: "Himanshu Patil", role: "TY POC" },
    { name: "Prachi Jadhav", role: "SY POC" },
    { name: "Priyanshu Gupta", role: "SY POC" },
  ] },
  { title: "Sponsorship", members: [
    { name: "Nishtha Parve", role: "TY POC" },
    { name: "Apurv Sagare", role: "TY POC" },
    { name: "Swarda Sawant", role: "SY POC" },
    { name: "Khush Patil", role: "SY POC" },
  ] },
  { title: "Design and Decoration", members: [
    { name: "Kaumudi Gite", role: "TY POC" },
    { name: "Shravani Patil", role: "TY POC" },
    { name: "Tejal Jadhav", role: "TY POC" },
    { name: "Samiksha Mote", role: "TY POC" },
    { name: "Rayee Wagh", role: "SY POC" },
    { name: "Rutuja Singh", role: "SY POC" },
    { name: "Diya Bhansali", role: "SY POC" },
  ] },
  { title: "Marketing", members: [
    { name: "Khushi Fulwani", role: "TY POC" },
    { name: "Anannya Jadhav", role: "TY POC" },
    { name: "Vedant Kulkarni", role: "SY POC" },
    { name: "Samruddhi Patil", role: "SY POC" },
  ] },
  { title: "Documentation", members: [
    { name: "Shriya Amilkanthwar", role: "TY POC" },
    { name: "Tanvi Jadhav", role: "TY POC" },
    { name: "Anuskha Parkhi", role: "TY POC" },
    { name: "Sarthak Kulkarni", role: "SY POC" },
  ] },
  { title: "WebDev", members: [
    { name: "Aniket Gawande", role: "TY POC" },
    { name: "Samarth Waghrulkar", role: "TY POC" },
    { name: "Sanika Patil", role: "TY POC" },
    { name: "Chinmay Joshi", role: "SY POC" },
  ] },
];

// Names and roles match the existing event pages. Phone numbers stay on those pages.
export const EVENT_TEAMS = [
  {
    slug: "infinity-trials", title: "Infinity Trials", accent: "#f2b84b",
    theme: "STRATEGY / SPEED / TEAMWORK",
    members: INFINITY_TRIALS.coordinators.map(({ name }) => ({ name, role: "Event Coordinator" })),
  },
  {
    // Source: public/researchx/index.html, Event Coordinators & Assistance.
    slug: "research-x", title: "Research X", accent: "#65cfff",
    theme: "IDEAS / INSIGHT / INNOVATION",
    members: [
      { name: "Uday Lingayat", role: "Event Lead Coordinator" },
      { name: "Ojas Barhate", role: "Technical Coordinator" },
      { name: "Aastha Chaudhari", role: "Public Relations & Operations" },
    ],
  },
  {
    // Source: public/bgmi/index.html, Event Leads & Contact.
    slug: "bgmi-elite-showdown", title: "BGMI Elite Showdown", accent: "#ff6677",
    theme: "SKILL / STRATEGY / SURVIVAL",
    members: [{ name: "Ayush Chandwadkar", role: "Event Coordinator" }],
  },
];

// Tech Roulette's rulebook has unfilled coordinator fields; the local StoryVerse
// source has no named leads. Add those event teams after names are confirmed.
