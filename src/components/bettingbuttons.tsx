"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { set } from "mongoose";
import { match } from "assert";

export default function BettingButtons({
  matchId,
  initialChoice,
  initialHomeScore,
  initialAwayScore,
  disabled: initialDisabled,
  startTimeStr,
}: {
  matchId: string;
  initialChoice: string | null;
  initialHomeScore?: number;
  initialAwayScore?: number;
  disabled: boolean;
  startTimeStr: string;
}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [homeScore, setHomeScore] = useState<number>(initialHomeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(initialAwayScore ?? 0);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(!!initialChoice);

  const [isLiveDisabled, setIsLiveDisabled] = useState(initialDisabled);

  useEffect(() => {
    if (initialDisabled) return; // Jos ottelu on jo suljettu, ei tarvitse asettaa timeria

    const matchDateString = startTimeStr.includes("+")
      ? startTimeStr
      : `${startTimeStr}+03:00`;
    const matchStartTime = new Date(matchDateString).getTime();

    // 1. Välitön tarkistus selaimessa heti kun komponentti mountataan
    if (Date.now() >= matchStartTime) {
      setIsLiveDisabled(true);
      return;
    }

    // 2. Lasketaan kuinka monta millisekuntia on ottelun alkamiseen
    const timeUntilStart = matchStartTime - Date.now();

    if (timeUntilStart > 0) {
      // Asetetaan ajastin laukeamaan täsmälleen aloitusaikaan
      const timer = setTimeout(() => {
        setIsLiveDisabled(true);
        setIsOpen(false); // Suljetaan veikkausvalikko livenä silmien edessä
      }, timeUntilStart);

      return () => clearTimeout(timer); // Siivotaan ajastin jos komponentti unmountataan
    }
  }, [startTimeStr, initialDisabled]);

  // Käytetään tästä eteenpäin tätä live-muuttujaa vanhan propsin sijaan
  const disabled = isLiveDisabled;

  const getChoice = () => {
    if (homeScore > awayScore) return "1";
    if (homeScore < awayScore) return "2";
    return "X";
  };

  const currentChoice = getChoice();

  const handleSave = async () => {
    if (disabled) {
      alert("Veikkaus on sulkeutunut tälle ottelulle.");
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          choice: currentChoice,
          homeScore,
          awayScore,
        }),
      });
      setIsSaved(true);
      setHasPrediction(true);
      setTimeout(() => {
        setIsSaved(false);
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      alert("Error saving!");
    } finally {
      setLoading(false);
    }
  };

  const adjustScore = (team: "home" | "away", delta: number) => {
    if (team === "home") setHomeScore(Math.max(0, homeScore + delta));
    else setAwayScore(Math.max(0, awayScore + delta));
  };

  return (
    <div
      className={`w-full mt-4 flex flex-col items-center ${disabled ? "pointer-events-none opacity-75" : ""}`}
    >
      {/* 2. TULOSVEDON STATUS-RIVI */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`cursor-pointer group flex flex-col items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all ${
            hasPrediction
              ? "bg-black/60 border-white/10"
              : "bg-transparent border-dashed border-gray-800"
          }`}
        >
          {hasPrediction ? (
            <span className="text-sm font-mono font-bold text-white-500 tracking-widest">
              {homeScore} : {awayScore}
            </span>
          ) : (
            <span className="text-[10px] text-gray-200 uppercase font-black tracking">
              {disabled ? "Sulkeutunut" : "Veikkaa"}
            </span>
          )}
        </div>
        {!disabled && hasPrediction && (
          <span className="text-blue-500 text-[10px] font-black ml-1 mt-1 uppercase">
            {isOpen ? "Sulje ▲" : "Muokkaa ▼"}
          </span>
        )}
      </div>

      {/* 3. LAAJENNETTU MUOKKAUSVALIKKO */}
      {isOpen && !disabled && session && (
        <div className="mt-4 w-full max-w-[260px] bg-gray-950 border border-gray-800 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-6">
            {/* Home Stepper */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => adjustScore("home", 1)}
                className="w-10 h-10 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-full text-xl font-bold transition-all"
              >
                +
              </button>
              <span className="text-3xl font-black text-white">
                {homeScore}
              </span>
              <button
                onClick={() => adjustScore("home", -1)}
                className="w-10 h-10 bg-gray-900 border border-gray-700 hover:border-red-900 rounded-full text-xl font-bold transition-all"
              >
                -
              </button>
            </div>

            <span className="text-2xl font-black text-gray-800">:</span>

            {/* Away Stepper */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => adjustScore("away", 1)}
                className="w-10 h-10 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-full text-xl font-bold transition-all"
              >
                +
              </button>
              <span className="text-3xl font-black text-white">
                {awayScore}
              </span>
              <button
                onClick={() => adjustScore("away", -1)}
                className="w-10 h-10 bg-gray-900 border border-gray-700 hover:border-red-900 rounded-full text-xl font-bold transition-all"
              >
                -
              </button>
            </div>
          </div>

          {session && (
            <button
              onClick={handleSave}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-black uppercase tracking-tighter transition-all ${
                isSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-95"
              }`}
            >
              {loading
                ? "Tallennetaan..."
                : isSaved
                  ? "Tallennettu! ✓"
                  : "Tallenna"}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {["1", "X", "2"].map((choice) => {
          const isActive = hasPrediction && currentChoice === choice;
          let activeClass = "";

          if (isActive) {
            if (choice === "1")
              activeClass =
                "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]";
            if (choice === "X")
              activeClass =
                "bg-gray-500 text-white border-gray-400 shadow-[0_0_15px_rgba(107,114,128,0.4)]";
            if (choice === "2")
              activeClass =
                "bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(5,150,105,0.4)]";
          } else {
            activeClass =
              "bg-gray-900/50 text-gray-700 border-gray-800 opacity-40";
          }

          return (
            <div
              key={choice}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-lg transition-all duration-300 ${activeClass}`}
            >
              {choice}
            </div>
          );
        })}
      </div>
      {!session && (
        <div className="mt-2 text-xs text-gray-500">
          Kirjaudu sisään veikataksesi!
        </div>
      )}
    </div>
  );
}
