import TeamRegistrationForm from "@/components/registration/TeamRegistrationForm";
import { TEAM_EVENTS } from "@/lib/team-events";

export default function TechRegistration() {
  return <TeamRegistrationForm policy={TEAM_EVENTS["tech-roulette"]} />;
}
