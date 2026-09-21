import TeamRegistrationForm from "@/components/registration/TeamRegistrationForm";
import { TEAM_EVENTS } from "@/lib/team-events";

export default function BgmiEliteShowdownPage() {
  return <TeamRegistrationForm policy={TEAM_EVENTS["bgmi-elite-showdown"]} />;
}
