export type TrialRound = {
  id: 1 | 2 | 3;
  title: string;
  codename: string;
  summary: string;
  details: string[];
  accent: string;
};

export type PowerCore = {
  id: string;
  label: string;
  color: string;
};

export const INFINITY_TRIALS = {
  slug: "infinity-trials",
  title: "THE INFINITY TRIALS",
  tagline: "Three Trials. Six Stones. One Ultimate Champion.",
  date: "9-10 October 2026",
  time: "9:00 AM onwards",
  venue: "5th Building, PCCOE, Nigdi",
  teamSize: "Exactly 4 members",
  roundCount: 3,
  finalists: "6 teams",
  prizePool: "₹17,000",
  registrationUrl: null as string | null,
  rulebookPath: "/rulebooks/infinity-trials.pdf",
  mission:
    "The stones have resurfaced. Across three increasingly challenging trials, teams will be tested on observation, memory, analytical thinking, teamwork, strategy, speed and adaptability.",
  disciplines: [
    "Observation",
    "Memory",
    "Analytical thinking",
    "Teamwork",
    "Strategy",
    "Speed",
    "Adaptability",
  ],
  rounds: [
    {
      id: 1,
      title: "Avengers Assemble",
      codename: "Detection protocol",
      summary: "Thirty questions. One precise race for the top twelve.",
      accent: "#36c8ff",
      details: [
        "30 questions total: 20 rapid-fire and 10 analytical.",
        "Visual, audio, character, movie and observation challenges.",
        "The analytical section has a 10-minute time limit.",
        "Qualification depends on correct answers and completion time.",
        "The top 12 teams qualify.",
      ],
    },
    {
      id: 2,
      title: "The Infinity War",
      codename: "Acquisition protocol",
      summary: "Twelve teams enter six stone-linked treasure hunts.",
      accent: "#ff9d2e",
      details: [
        "The 12 qualified teams are allocated across six stones by lottery.",
        "Two teams compete for each stone in a linked treasure hunt.",
        "The winning team in each pair claims its stone.",
        "Each winner receives one buff and one debuff for Round 3.",
        "The buff helps your own team; the debuff can target another finalist.",
        "Six teams qualify; power details remain classified until the event.",
      ],
    },
    {
      id: 3,
      title: "Endgame",
      codename: "Relay protocol",
      summary: "Six teams. Four linked mini-games. One final score.",
      accent: "#ff2b35",
      details: [
        "Six finalist teams compete with four participants each.",
        "Each participant completes a different relay-style mini-game.",
        "Teams receive three minutes to assign their players.",
        "Round 2 buffs and debuffs activate before the relay begins.",
        "Each mini-game is worth 25 points, for a total of 100.",
        "Completion time is the tiebreaker.",
      ],
    },
  ] satisfies TrialRound[],
  powerCores: [
    { id: "reality", label: "Reality Core", color: "#ff4050" },
    { id: "space", label: "Space Core", color: "#36c8ff" },
    { id: "power", label: "Power Core", color: "#a76cff" },
    { id: "mind", label: "Mind Core", color: "#ffc845" },
    { id: "time", label: "Time Core", color: "#50e878" },
    { id: "soul", label: "Soul Core", color: "#ff8a35" },
  ] satisfies PowerCore[],
  prizes: [
    { place: "Winner", amount: "₹8,000", rank: "01" },
    { place: "Runner-up", amount: "₹5,500", rank: "02" },
    { place: "Second runner-up", amount: "₹3,500", rank: "03" },
  ],
  rules: [
    "Each team must consist of exactly four participants.",
    "Teams must report to the designated venue before the reporting time announced by the organizers.",
    "Participants must carry valid college identification when required.",
    "Mobile phones, smartwatches and other unauthorized electronic devices may not be used during a round unless explicitly permitted.",
    "Cheating, unauthorized assistance, tampering or outside communication may result in immediate disqualification.",
    "Participants must follow instructions from event coordinators and judges.",
    "Arguments, disruptive behaviour or deliberate interference with another team may result in penalties or disqualification.",
    "Once a round begins, participants may not leave the designated area without permission.",
    "Judges' and organizers' decisions are final.",
    "Organizers may adjust a rule or procedure in an unforeseen situation and will communicate any change before implementation.",
    "Mini-games for Rounds 2 and 3 will be revealed before those rounds begin.",
  ],
  coordinators: [
    { name: "Viraj Pathare", phone: "7744891849", initials: "VP" },
    { name: "Prajjwal Singh", phone: "7745031022", initials: "PS" },
  ],
} as const;

export type InfinityTrialsEvent = typeof INFINITY_TRIALS;
