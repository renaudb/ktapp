import { TeamBrowser } from "./team-browser";
import { killTeams } from "./team-cards";

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_#7f1d1d_0,_#0f172a_44%,_#020617_100%)] text-white">
      <TeamBrowser teams={killTeams} />
    </main>
  );
}
