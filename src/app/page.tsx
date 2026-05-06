import Image from "next/image";
import dbConnect from "../lib/dbConnect";
import Match from "../models/Match";
import Prediction from "../models/Prediction";
import BettingButtons from "../components/bettingbuttons";
import { match } from "assert/strict";

export default async function Home() {
  await dbConnect();

  const matches = await Match.find({}).lean();

  const userPredictions = await Prediction.find({ userId: "test-user" }).lean();

  console.log("Fetched matches from database:", matches);
  console.log("Fetched user predictions from database:", userPredictions);

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
      <header className="max-w-3xl mx-auto mb-12 text-center">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-red-500 uppercase tracking-tighter">
          Ice Hockey World Championships 2026
        </h1>
        <div className="h-1 w-24 bg-blue-500 mx-auto mt-4 mb-4 rounded-full"></div>
        <h2 className="text-lg font-black text-transparent bg-clip-text bg-white uppercase tracking-tighter">
          Make your predictions and see how you rank against other fans!
        </h2>
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

                return (
                  <div
                    key={match._id}
                    className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors shadow-xl"
                  >
                    {/* Kotijoukkue */}
                    <div className="flex-1 text-right font-bold text-xl sm:text-2xl truncate px-2">
                      {match.home}
                    </div>

                    {/* Keskiosa */}
                    <div className="flex flex-col items-center min-w-[140px] px-4">
                      <span className="text-lg font-black text-blue-400 mb-1">
                        {new Date(match.startTime).toLocaleTimeString("fi-FI", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="bg-black/50 px-4 py-1 rounded-full text-2xl font-mono font-bold text-yellow-500 border border-white/5">
                        {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                      </div>

                      <BettingButtons
                        matchId={match._id}
                        initialChoice={
                          userPrediction ? userPrediction.choice : null
                        }
                      />
                    </div>

                    {/* Vierasjoukkue */}
                    <div className="flex-1 text-left font-bold text-xl sm:text-2xl truncate px-2">
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
