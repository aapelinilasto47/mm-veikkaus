import Image from "next/image";
import dbConnect from "../lib/dbConnect";
import Match from "../models/Match";
import Prediction from "../models/Prediction";
import BettingButtons from "../components/bettingbuttons";
import { match } from "assert/strict";
import { getServerSession } from "next-auth/next";
import { calculateMatchPoints } from "../lib/scoreCalculator";

export default async function Home() {
  await dbConnect();

  const matches = await Match.find({}).lean();
  const now = new Date();

  const session = await getServerSession();

  const userPredictions = await Prediction.find({
    userId: session?.user?.email,
  }).lean();

  console.log("Fetched matches from database:", matches);
  console.log("Fetched user predictions from database:", userPredictions);

  // 1. Haetaan KAIKKI päättyneet ottelut ja KAIKKI veikkaukset
  const allMatches = await Match.find({}).lean();
  const allPredictions = await Prediction.find({}).lean();

  // 2. Lasketaan pisteet jokaiselle käyttäjälle
  const leaderBoardMap: Record<
    string,
    { name: string; points: number; jackpots: number }
  > = {};

  allPredictions.forEach((pred: any) => {
    const match = allMatches.find(
      (m: any) => m._id.toString() === pred.matchId,
    );

    const isMatchFinished =
      match && match.homeScore !== null && match.awayScore !== null;
    // Lasketaan pisteet vain jos ottelulla on jo lopputulos
    if (match && isMatchFinished) {
      const scoreResult = calculateMatchPoints(
        match.homeScore,
        match.awayScore,
        pred.homeScore,
        pred.awayScore,
      );

      if (!leaderBoardMap[pred.userId]) {
        leaderBoardMap[pred.userId] = {
          name: pred.userId,
          points: 0,
          jackpots: 0,
        };
      }

      leaderBoardMap[pred.userId].points += scoreResult.points;
      if (scoreResult.isPerfectScore) {
        leaderBoardMap[pred.userId].jackpots += 1;
      }
    }
  });

  // 3. Muutetaan objekti listaksi ja järjestetään pisteiden mukaan
  const leaderboard = Object.values(leaderBoardMap).sort(
    (a, b) => b.points - a.points,
  );

  const groupedMatches = matches.reduce((groups: any, match: any) => {
    const d = new Date(match.startTime);

    // Viikonpäivä englanniksi (esim. Friday)
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });

    // Päivä ja kuukausi muodossa D.M.
    const dayMonth = `${d.getDate()}.${d.getMonth() + 1}.`;

    const dateLabel = `${weekday} ${dayMonth}`;

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(match);

    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      {session ? (
        <div className="flex items-center gap-4">
          <span>
            Currently logged in as: <b>{session.user?.name}</b>
          </span>
          <a
            href="/api/auth/signout"
            className="text-sm bg-red-600 px-3 py-1 rounded"
          >
            Log out?
          </a>
        </div>
      ) : (
        <a
          href="/api/auth/signin"
          className="bg-blue-600 px-4 py-2 rounded font-bold"
        >
          Log in!
        </a>
      )}
      <header className="max-w-3xl mx-auto mt-8 mb-12 text-center">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-red-500 uppercase tracking-tighter">
          Ice Hockey World Championships 2026
        </h1>
        <div className="h-1 w-24 bg-blue-500 mx-auto mt-4 mb-4 rounded-full"></div>
        <h2 className="text-lg mb-10 font-black text-transparent bg-clip-text bg-white uppercase tracking-tighter">
          Make your predictions and see how you rank against other fans!{" "}
          <br></br>Login to save your predictions and compete with friends!
        </h2>

        <div className="max-w-3xl mx-auto mb-8">
          <details className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <summary className="list-none p-4 cursor-pointer flex justify-between items-center group-open:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <span className="font-black uppercase tracking-tighter text-blue-400">
                  Show Leaderboard
                </span>
              </div>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>

            <div className="p-4 bg-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-800">
                    <th className="pb-2">Pos</th>
                    <th className="pb-2">Player</th>
                    <th className="pb-2 text-right">Jackpots</th>
                    <th className="pb-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leaderboard.map((player, index) => (
                    <tr
                      key={player.name}
                      className={
                        player.name === session?.user?.email
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }
                    >
                      <td className="py-3 font-mono text-xs">{index + 1}.</td>
                      <td className="py-3 font-bold truncate max-w-[120px]">
                        {player.name.split("@")[0]}
                      </td>
                      <td className="py-3 text-right text-xs">
                        🎯 {player.jackpots}
                      </td>
                      <td className="py-3 text-right font-black text-lg">
                        {player.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {Object.keys(groupedMatches).map((date) => (
          <section key={date} className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-gray-300 border-b border-gray-800 pb-2 capitalize">
              {date}
            </h2>

            <div className="grid gap-3">
              {groupedMatches[date].map((match: any) => {
                const userPrediction = userPredictions.find(
                  (p: any) => p.matchId === match._id,
                );

                const isMatchStarted = new Date(match.startTime) <= now;

                return (
                  <div
                    key={match._id}
                    className="bg-gray-900 p-3 sm:p-5 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors shadow-xl overflow-hidden"
                  >
                    {/* Kotijoukkue: text-md mobiiliin, text-2xl desktopiin */}
                    <div className="flex-1 text-right font-bold text-md sm:text-2xl truncate px-1">
                      {match.home}
                    </div>

                    {/* Keskiosa: Kavennetaan min-width mobiilissa */}
                    <div className="flex flex-col items-center min-w-[110px] sm:min-w-[140px] px-2">
                      <div className="bg-black/50 px-3 py-1 rounded-full text-lg sm:text-2xl font-mono font-bold text-yellow-500 border border-white/5">
                        {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                      </div>

                      <span className="text-xs sm:text-lg font-black text-blue-400 mt-2">
                        {new Date(match.startTime).toLocaleTimeString("fi-FI", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <BettingButtons
                        matchId={match._id}
                        initialChoice={
                          userPrediction ? userPrediction.choice : null
                        }
                        disabled={isMatchStarted}
                      />
                    </div>

                    {/* Vierasjoukkue: text-md mobiiliin, text-2xl desktopiin */}
                    <div className="flex-1 text-left font-bold text-md sm:text-2xl truncate px-1">
                      {match.away}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
