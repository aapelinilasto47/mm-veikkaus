import dbConnect from "../lib/dbConnect";
import Match from "../models/Match";
import Prediction from "../models/Prediction";
import BettingButtons from "../components/bettingbuttons";
import { getServerSession } from "next-auth/next";
import { calculateMatchPoints } from "../lib/scoreCalculator";

import Leaderboard from "../components/leaderboard";

import ProfileNook from "../components/profilenook";

export const dynamic = "force-dynamic";

// MUUTOS: Otetaan vastaan searchParams, jotta turnaus voidaan valita URL-osoitteesta
interface HomeProps {
  searchParams: Promise<{ turnaus?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  await dbConnect();

  // MUUTOS: Luetaan turnaus parametreista, oletuksena uusi futis_2026
  const resolvedSearchParams = await searchParams;
  const activeTournament =
    resolvedSearchParams.turnaus === "latka" ? "lätkä_2026" : "futis_2026";

  const nowServerTime = new Date().getTime();
  const session = await getServerSession();

  // 1. Haetaan ottelut ja veikkaukset suodatettuna VALITUN turnauksen mukaan
  const allMatches = await Match.find({ tournament: activeTournament }).lean();

  const specialMatch = await Match.findOne({
    isSpecial: true,
    tournament: activeTournament,
  }).lean();
  const regularMatches = allMatches.filter((m: any) => m.isSpecial !== true);

  // Haetaan vain ne veikkaukset, jotka kuuluvat tämän turnauksen otteluihin
  const matchIds = allMatches.map((m) => m._id.toString());
  const allPredictions = await Prediction.find({
    matchId: { $in: matchIds },
  }).lean();

  // Haetaan kirjautuneen käyttäjän omat veikkaukset dynaamista nappuloiden tilaa varten
  const userPredictions = session?.user?.email
    ? await Prediction.find({
        userId: session.user.email,
        matchId: { $in: matchIds },
      }).lean()
    : [];

  // 2. Lasketaan pisteet jokaiselle käyttäjälle (Vain valitun turnauksen datasta!)
  const leaderBoardMap: Record<
    string,
    { name: string; username?: string; points: number; jackpots: number }
  > = {};

  allPredictions.forEach((pred: any) => {
    if (!leaderBoardMap[pred.userId]) {
      leaderBoardMap[pred.userId] = {
        name: pred.userId,
        username: pred.username || undefined, //
        points: 0,
        jackpots: 0,
      };
    } else if (pred.username && !leaderBoardMap[pred.userId].username) {
      // Varmistetaan, että jos jossain myöhemmässä dokumentissa on username, se napataan talteen
      leaderBoardMap[pred.userId].username = pred.username;
    }
  });

  allPredictions.forEach((pred: any) => {
    const match = allMatches.find(
      (m: any) => m._id.toString() === pred.matchId,
    );

    const isMatchFinished =
      match && match.homeScore !== null && match.awayScore !== null;

    if (match && isMatchFinished) {
      // MUUTOS: Välitetään uusi activeTournament-parametri pistelaskuriin
      const scoreResult = calculateMatchPoints(
        match.homeScore,
        match.awayScore,
        pred.homeScore,
        pred.awayScore,
        match.isPlayoff,
        activeTournament,
      );

      leaderBoardMap[pred.userId].points += scoreResult.points;
      if (scoreResult.isPerfectScore) {
        leaderBoardMap[pred.userId].jackpots += 1;
      }
    }
  });

  const sortedLeaderboard = Object.values(leaderBoardMap).sort(
    (a, b) => b.points - a.points || b.jackpots - a.jackpots,
  );

  const sortedMatches = [...regularMatches].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const groupedMatches = sortedMatches.reduce((groups: any, match: any) => {
    const d = new Date(match.startTime);
    const dayMonth = `${d.getDate()}.${d.getMonth() + 1}.`;

    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    let dateLabel = "";
    if (isToday) {
      dateLabel = `Tänään ${dayMonth}`;
    } else {
      const weekday = d.toLocaleDateString("fi-FI", { weekday: "long" });
      dateLabel = `${weekday} ${dayMonth}`;
    }

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(match);

    return groups;
  }, {});

  const pastDays: string[] = [];
  const activeDays: string[] = [];

  Object.keys(groupedMatches).forEach((date) => {
    const isAllMatchesFinished = groupedMatches[date].every(
      (match: any) => match.homeScore !== null && match.awayScore !== null,
    );

    if (isAllMatchesFinished) {
      pastDays.push(date);
    } else {
      activeDays.push(date);
    }
  });

  const renderDaySection = (date: string) => (
    <section key={date} className="mb-10">
      <h2
        className={`text-xl font-bold mb-4 mx-4 border-b border-gray-800 pb-2 capitalize ${
          date.startsWith("Tänään")
            ? "text-yellow-400 font-black animate-pulse"
            : "text-gray-300"
        }`}
      >
        {date}
      </h2>
      <div className="grid gap-3">
        {groupedMatches[date].map((match: any) => {
          const userPrediction = userPredictions.find(
            (p: any) => p.matchId === match._id.toString(),
          );

          const matchDateString = match.startTime.includes("+")
            ? match.startTime
            : `${match.startTime}+03:00`;
          const matchStartTime = new Date(matchDateString).getTime();
          const isMatchStarted =
            match.homeScore !== null && match.awayScore !== null;

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
              match.isPlayoff,
              activeTournament,
            );
            earnedPoints = scoreDetails.points;
          }

          let pointColorClass = "text-gray-500";
          const maxPoints =
            activeTournament === "lätkä_2026"
              ? match.isPlayoff
                ? 20
                : 10
              : match.isPlayoff
                ? 12
                : 6;
          const midPoints =
            activeTournament === "lätkä_2026"
              ? match.isPlayoff
                ? 10
                : 5
              : match.isPlayoff
                ? 8
                : 4;
          const winnerPoints =
            activeTournament === "lätkä_2026"
              ? match.isPlayoff
                ? 6
                : 3
              : match.isPlayoff
                ? 6
                : 3;
          const minPoints = match.isPlayoff ? 2 : 1; // Väärä merkki, mutta maalin päässä

          if (earnedPoints === maxPoints && earnedPoints > 0) {
            pointColorClass = "text-rose-500 animate-pulse";
          } else if (earnedPoints >= midPoints) {
            pointColorClass = "text-teal-500";
          } else if (earnedPoints >= winnerPoints) {
            pointColorClass = "text-emerald-500";
          } else if (earnedPoints >= minPoints) {
            pointColorClass = "text-white/80";
          }

          return (
            <div
              key={match._id.toString()}
              className={`relative p-3 sm:p-5 rounded-xl border flex justify-between items-center hover:border-gray-600 transition-colors shadow-xl overflow-hidden ${
                match.isPlayoff
                  ? "bg-gradient-to-br from-blue-950/20 to-purple-700/20 border-indigo-900/40 pt-7 sm:pt-9"
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              {/* PUDOTUSPELI-BADGE KORTIN YLÄREUNASSA */}
              {match.isPlayoff && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-[9px] sm:text-xs font-black uppercase tracking-widest py-1 sm:py-1 text-center text-white flex items-center justify-center gap-1 shadow-sm select-none">
                  🔥 Pudotuspeli – Tuplapisteet! 🔥
                </div>
              )}

              {/* KOTIJOUKKUE: Lukittu 30% leveys mobiilissa siirtymien estämiseksi */}
              <div className="w-[30%] sm:flex-1 text-center font-bold text-sm sm:text-2xl whitespace-normal break-words sm:truncate px-1">
                {match.home}
              </div>

              {/* KESKIOSA: Tuloslaatikko ja napit pysyvät nyt jämptisti keskellä */}
              <div className="flex flex-col items-center min-w-[125px] sm:min-w-[140px] px-1 mt-1">
                <div className="flex items-center flex-col bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
                  <div className="text-[9px] sm:text-sm text-gray-500 uppercase tracking-widest py-1">
                    Lopputulos
                  </div>
                  <div className="bg-black/50 px-3 py-1 rounded-full text-md sm:text-2xl font-mono font-bold text-yellow-500 border border-white/5">
                    {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                  </div>
                </div>
                <div className="mt-2 h-5 sm:h-7 flex items-center justify-center">
                  {scoreDetails ? (
                    <span
                      className={`text-xs sm:text-lg font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${pointColorClass}`}
                    >
                      +{earnedPoints} PTS
                    </span>
                  ) : match.homeScore !== null ? (
                    <span className="text-[10px] sm:text-lg font-black text-gray-500 uppercase tracking-widest">
                      OHI
                    </span>
                  ) : (
                    <span className="text-xs sm:text-lg font-black text-blue-400">
                      {match.startTime.split("T")[1].substring(0, 5)}
                    </span>
                  )}
                </div>

                <BettingButtons
                  key={match._id.toString()}
                  matchId={match._id.toString()}
                  initialChoice={userPrediction ? userPrediction.choice : null}
                  initialHomeScore={
                    userPrediction ? userPrediction.homeScore : null
                  }
                  initialAwayScore={
                    userPrediction ? userPrediction.awayScore : null
                  }
                  disabled={isMatchStarted}
                  startTimeStr={match.startTime}
                />
              </div>

              {/* VIERASJOUKKUE: Lukittu 30% leveys mobiilissa siirtymien estämiseksi */}
              <div className="w-[30%] sm:flex-1 text-center font-bold text-sm sm:text-2xl whitespace-normal break-words sm:truncate px-1">
                {match.away}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderSpecialMatch = (match: any) => {
    const userPrediction = userPredictions.find(
      (p: any) => p.matchId === match._id.toString(),
    );

    const isSpecialStarted =
      new Date(match.startTime).getTime() < nowServerTime;
    const isSpecialFinished =
      match.homeScore !== null && match.awayScore !== null;

    if (isSpecialStarted) {
      return (
        <div className="mb-6 bg-gradient-to-r from-amber-950/20 to-gray-900 border border-amber-500/20 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-xl max-w-3xl mx-auto">
          {/* VASEN REUNA / YLÄOSA: Iconi, Otsikko ja Lukittu-status pysyvät samassa linjassa */}
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5 flex-shrink-0">🏆</span>
            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider leading-none">
                {match.home}
              </h2>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">
                Lukittu
              </span>
            </div>
          </div>

          {/* OIKEA REUNA / ALAOSA: Tulokset ja Oma veikkaus – mobiilissa linjassa otsikon kanssa (pl. ikonin viemä tila) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pl-8 sm:pl-0 w-full sm:w-auto ml-0.5 sm:ml-0">
            {/* Näytetään lopputulos, jos kisa on ratkennut */}
            {isSpecialFinished && (
              <div className="bg-amber-900/40 border border-amber-700/30 px-3 py-1 rounded-lg flex sm:flex-col justify-between sm:justify-center items-center gap-2 sm:gap-0 min-w-[100px]">
                <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                  Voittaja
                </span>
                <span className="font-mono font-bold text-sm text-yellow-400">
                  {match.homeScore}
                </span>
              </div>
            )}

            {/* Käyttäjän oma veikkaus: täydellisessä linjassa mobiilissa */}
            <div className="bg-black/45 border border-white/5 px-4 py-2 rounded-lg flex justify-between sm:justify-start items-center gap-3 text-xs w-full sm:w-auto">
              <span className="text-gray-400 uppercase tracking-widest text-[10px] font-medium">
                Oma veikkauksesi:
              </span>
              <span className="font-black text-yellow-500 uppercase tracking-wide">
                {userPrediction?.homeScore || userPrediction?.choice || "-"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // --- 2. ALKUPERÄINEN ISO LOMAKE (KUN VEIKKAUS ON VIELÄ AUKI) ---
    return (
      <div className="mb-10 bg-gradient-to-br from-amber-950/20 to-yellow-950/20 border border-amber-500/30 p-4 sm:p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl animate-bounce">🏆</span>
          <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider">
            {match.home}
          </h2>
        </div>

        <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col justify-between items-center gap-4">
          <div>
            <p className="text-xs text-center text-gray-400 uppercase tracking-widest mb-2">
              Veikkaa kisojen mestaria!
            </p>
            <p className="text-md text-center text-rose-500 font-bold uppercase tracking-wider">
              Oikeasta veikkauksesta +10 pistettä!
            </p>
          </div>

          <BettingButtons
            matchId={match._id.toString()}
            initialChoice={userPrediction ? userPrediction.choice : null}
            initialHomeScore={userPrediction ? userPrediction.homeScore : null}
            initialAwayScore={userPrediction ? userPrediction.awayScore : null}
            disabled={isSpecialStarted || isSpecialFinished}
            startTimeStr={match.startTime}
            isSpecial={true}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-4">
        {session ? (
          <ProfileNook
            sessionUser={session.user as any}
            currentUsername={
              sortedLeaderboard.find((p) => p.name === session.user?.email)
                ?.username
            }
          />
        ) : (
          <a
            href="/api/auth/signin"
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            Kirjaudu sisään!
          </a>
        )}
      </div>
      <header className="max-w-3xl mx-auto mt-8 mb-12 text-center">
        {/* MUUTOS: Otsikko vaihtuu valitun turnauksen mukaan dynaamisesti */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-red-500 uppercase tracking-tighter">
          {activeTournament === "futis_2026"
            ? "Futiksen MM-veikkaus 2026"
            : "Lätkän MM-veikkaus 2026"}
        </h1>

        <span className="text-sm text-blue-400 uppercase tracking-widest font-bold bg-blue-900/30 px-2 py-1 rounded mt-3 inline-block">
          Beta
        </span>

        <div className="h-1 w-24 bg-blue-300 mx-auto mt-6 mb-6 rounded-full"></div>

        {/* MUUTOS: Turnauksen vaihtopainike (Arkisto / Palaa takaisin) */}
        <div className="mb-8">
          <a
            href={activeTournament === "futis_2026" ? "/?turnaus=latka" : "/"}
            className="inline-flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 px-4 py-2 rounded-xl transition-all font-bold uppercase tracking-wider text-gray-300 shadow-md"
          >
            {activeTournament === "futis_2026"
              ? "Katso Lätkän MM-kisojen tulokset"
              : "Palaa Jalkapallon MM-kisoihin"}
          </a>
        </div>

        {session && sortedLeaderboard.length > 0 && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded text-center">
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

        <div className="max-w-3xl mx-auto mb-8">
          <Leaderboard
            sortedLeaderboard={JSON.parse(JSON.stringify(sortedLeaderboard))}
            currentUserEmail={session?.user?.email}
          />
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {pastDays.length > 0 && (
          <details className="group bg-gray-900 rounded-2xl mb-8 overflow-hidden shadow-xl">
            <summary className="list-none p-4 cursor-pointer flex justify-between items-center bg-gray-900/40 hover:bg-gray-900/60 transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="text-xl">📁</span>
                <span className="font-black uppercase tracking-wider text-sm text-gray-400 group-open:hidden">
                  Näytä menneet ottelut
                </span>
                <span className="font-black uppercase tracking-wider text-sm text-yellow-500/80 hidden group-open:inline">
                  Piilota menneet ottelut
                </span>
              </div>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>

            <div className="pt-6 pb-4 bg-gray-950/50 grid gap-3">
              {[...pastDays].reverse().map((date) => renderDaySection(date))}
              <div className="flex justify-center">
                <a
                  href="#top"
                  className="text-sm text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                >
                  Takaisin ylös
                </a>
              </div>
            </div>
          </details>
        )}

        {specialMatch && renderSpecialMatch(specialMatch)}

        {activeDays.map((date) => renderDaySection(date))}

        {activeDays.length === 0 && pastDays.length > 0 && (
          <p className="text-center text-gray-500 italic py-10">
            Kaikki turnauksen ottelut on pelattu! Katso tulokset ylhäältä.
          </p>
        )}

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
      </div>
    </div>
  );
}
