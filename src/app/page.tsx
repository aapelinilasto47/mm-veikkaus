import Image from "next/image";
import dbConnect from "../lib/dbConnect";
import Match from "../models/Match";
import Prediction from "../models/Prediction";
import BettingButtons from "../components/bettingbuttons";
import { match } from "assert/strict";
import { getServerSession } from "next-auth/next";
import { calculateMatchPoints } from "../lib/scoreCalculator";
import RulesAccordion from "../components/rulesaccordion";
import Leaderboard from "../components/leaderboard";

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
    if (!leaderBoardMap[pred.userId]) {
      leaderBoardMap[pred.userId] = {
        name: pred.userId, // Tämä on yleensä sähköposti sessionista
        points: 0,
        jackpots: 0,
      };
    }
  });

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
        match.isPlayoff, // Välitetään tieto playoff-ottelusta
      );

      leaderBoardMap[pred.userId].points += scoreResult.points;
      if (scoreResult.isPerfectScore) {
        leaderBoardMap[pred.userId].jackpots += 1;
      }
    }
  });

  // 3. Muutetaan objekti listaksi ja järjestetään pisteiden mukaan
  const sortedLeaderboard = Object.values(leaderBoardMap).sort(
    (a, b) => b.points - a.points || b.jackpots - a.jackpots,
  );

  const groupedMatches = matches.reduce((groups: any, match: any) => {
    const d = new Date(match.startTime);

    // Viikonpäivä englanniksi (esim. Friday)
    const weekday = d.toLocaleDateString("fi-FI", { weekday: "long" });

    // Päivä ja kuukausi muodossa D.M.
    const dayMonth = `${d.getDate()}.${d.getMonth() + 1}.`;

    const isPlayoff = match.isPlayoff ? " (Pudotuspelit)" : "";

    const dateLabel = `${weekday} ${dayMonth} ${isPlayoff}`;

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
            Sisäänkirjautunut: <b>{session.user?.name}</b>
          </span>
          <a
            href="/api/auth/signout"
            className="text-sm bg-red-600 px-3 py-1 rounded"
          >
            Kirjaudu ulos
          </a>
        </div>
      ) : (
        <a
          href="/api/auth/signin"
          className="bg-blue-600 px-4 py-2 rounded font-bold"
        >
          Kirjaudu sisään!
        </a>
      )}
      <header className="max-w-3xl mx-auto mt-8 mb-12 text-center">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-red-500 uppercase tracking-tighter">
          Lätkän MM-veikkaus 2026
        </h1>
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded border border-blue-500/30 uppercase tracking-widest">
          Beta
        </span>
        <div className="h-1 w-24 bg-blue-500 mx-auto mt-4 mb-4 rounded-full"></div>
        <h2 className="text-lg mb-10 font-black text-transparent bg-clip-text bg-white uppercase tracking-tighter">
          Veikkaa otteluiden tuloksia ja kilpaile ystäviesi kanssa!
        </h2>
        {session && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded text-center">
            <p className="text-blue-300 text-sm uppercase tracking-widest font-bold">
              Olet tällä hetkellä sijalla <br></br>
              <span className="text-yellow-400 font-black text-lg">
                {sortedLeaderboard.findIndex(
                  (p) => p.name === session.user?.email,
                ) + 1}
                {` / ${sortedLeaderboard.length}`}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <a
            href="https://github.com/aapelinilasto47/mm-veikkaus"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition-colors font-black uppercase tracking-widest"
          >
            <span>GitHub</span>
          </a>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <Leaderboard
            sortedLeaderboard={JSON.parse(JSON.stringify(sortedLeaderboard))}
            currentUserEmail={session?.user?.email}
          />
        </div>
        <div className="w-full bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg mb-6 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-xs md:text-sm text-amber-200/80 leading-relaxed">
            <span className="font-bold text-amber-400 uppercase">Huom:</span>{" "}
            Sovellus on vielä kehitysvaiheessa. Tulosten päivityksessä ja
            pistelaskennassa saattaa esiintyä viiveitä tai epätarkkuuksia
            testauksen aikana. Pahoittelemme mahdollisia häiriöitä ja kiitämme
            kärsivällisyydestä!
          </p>
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

                let earnedPoints = 0;
                let scoreDetails = null;

                if (
                  match.homeScore !== null &&
                  match.awayScore !== null &&
                  userPrediction
                ) {
                  scoreDetails = calculateMatchPoints(
                    match.homeScore,
                    match.awayScore,
                    userPrediction.homeScore,
                    userPrediction.awayScore,
                    match.isPlayoff, // Välitetään tieto playoff-ottelusta
                  );
                  earnedPoints = scoreDetails.points;
                }

                return (
                  <div
                    key={match._id}
                    className="bg-gray-900 p-3 sm:p-5 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors shadow-xl overflow-hidden"
                  >
                    {/* Kotijoukkue */}
                    <div className="flex-1 text-right font-bold text-md sm:text-2xl truncate px-1">
                      {match.home}
                    </div>

                    {/* Keskiosa */}
                    <div className="flex flex-col items-center min-w-[110px] sm:min-w-[140px] px-2 mt-1">
                      {/* Tulos */}
                      <div className="bg-black/50 px-3 py-1 rounded-full text-lg sm:text-2xl font-mono font-bold text-yellow-500 border border-white/5">
                        {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                      </div>

                      {/* VAIHTUVA SISÄLTÖ: Pisteet TAI Status (Kellonaika/FINAL) */}
                      <div className="mt-2 h-5 sm:h-7 flex items-center justify-center">
                        {scoreDetails ? (
                          // Tapaus 1: Pisteitä on (peli ohi + veikkaus tehty)
                          <span
                            className={`text-sm sm:text-lg font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              earnedPoints === 10
                                ? "text-rose-500 animate-pulse"
                                : earnedPoints >= 5
                                  ? "text-emerald-500"
                                  : earnedPoints >= 3
                                    ? "text-emerald-500"
                                    : "text-gray-500"
                            }`}
                          >
                            +{earnedPoints} PTS
                          </span>
                        ) : match.homeScore !== null ? (
                          // Tapaus 2: Peli on ohi, mutta EI veikkausta (tai scoreDetails puuttuu)
                          <span className="text-xs sm:text-lg font-black text-gray-500 uppercase tracking-widest">
                            OHI
                          </span>
                        ) : (
                          // Tapaus 3: Peli on vasta tulossa
                          <span className="text-xs sm:text-lg font-black text-blue-400">
                            {new Date(match.startTime).toLocaleTimeString(
                              "fi-FI",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>

                      <BettingButtons
                        matchId={match._id}
                        initialChoice={
                          userPrediction ? userPrediction.choice : null
                        }
                        initialHomeScore={
                          userPrediction ? userPrediction.homeScore : null
                        }
                        initialAwayScore={
                          userPrediction ? userPrediction.awayScore : null
                        }
                        disabled={isMatchStarted}
                      />
                    </div>

                    {/* Vierasjoukkue */}
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
