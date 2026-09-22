import TeamRegistrationForm from "@/components/registration/TeamRegistrationForm";
import { TEAM_EVENTS } from "@/lib/team-events";

export default function ResearchXPage() {
  return <TeamRegistrationForm policy={TEAM_EVENTS["research-x"]} />;
}
