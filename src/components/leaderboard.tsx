"use client"; // Tämä tekee tästä Client Componentin

import { useState, useEffect } from "react";
import RulesAccordion from "./rulesaccordion";

interface Player {
  name: string;
  points: number;
  jackpots: number;
}

export default function Leaderboard({
  sortedLeaderboard,
  currentUserEmail,
}: {
  sortedLeaderboard: Player[];
  currentUserEmail?: string | null;
}) {
  const [followedPlayers, setFollowedPlayers] = useState<string[]>([]);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);

  // Ladataan suosikit selaimen muistista
  useEffect(() => {
    const saved = localStorage.getItem("followed_players");
    if (saved) setFollowedPlayers(JSON.parse(saved));
  }, []);

  // Tyhjennetään seurattavat, jos session päättyy (uloskirjautuminen)
  useEffect(() => {
    if (!currentUserEmail) {
      setFollowedPlayers([]);
      // Jos haluat tyhjentää ne myös pysyvästi muistista:
      // localStorage.removeItem("followed_players");
    }
  }, [currentUserEmail]);

  // Suosikin lisäys/poisto
  const toggleFollow = (name: string) => {
    const newFollowed = followedPlayers.includes(name)
      ? followedPlayers.filter((p) => p !== name)
      : [...followedPlayers, name];
    setFollowedPlayers(newFollowed);
    localStorage.setItem("followed_players", JSON.stringify(newFollowed));
  };

  // Suodatetaan lista, jos "Seurattavat" on valittu
  const displayBoard = showOnlyFollowed
    ? sortedLeaderboard.filter(
        (p) => followedPlayers.includes(p.name) || p.name === currentUserEmail,
      )
    : sortedLeaderboard;

  return (
    <div className="max-w-3xl mx-auto mb-8">
      <details className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <summary className="list-none p-4 cursor-pointer flex justify-between items-center group-open:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <span className="font-black uppercase tracking-tighter text-blue-400">
              Tulostaulukko {showOnlyFollowed ? "(Seurattavat)" : ""}
            </span>
          </div>
          <span className="text-gray-500 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        <div className="p-4 bg-black/20">
          <div className="flex gap-2 mb-4 border-b border-gray-800 pb-4">
            <button
              onClick={() => setShowOnlyFollowed(false)}
              className={`px-4 py-1 text-[10px] uppercase font-bold rounded-full transition-colors ${!showOnlyFollowed ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}
            >
              Kaikki
            </button>
            <button
              onClick={() => setShowOnlyFollowed(true)}
              className={`px-4 py-1 text-[10px] uppercase font-bold rounded-full transition-colors ${showOnlyFollowed ? "bg-yellow-600 text-white" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}
            >
              ⭐ Seurattavat ({followedPlayers.length})
            </button>
          </div>

          <RulesAccordion />

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-800">
                <th className="pb-2">Sija</th>
                <th className="pb-2">Pelaaja</th>
                <th className="pb-2 text-right">Jackpotit</th>
                <th className="pb-2 text-right">Pisteet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayBoard.slice(0, 10).map((player, index) => {
                const isMe = player.name === currentUserEmail;
                const isFollowed = followedPlayers.includes(player.name);

                return (
                  <tr
                    key={player.name}
                    className={isMe ? "text-yellow-500" : "text-gray-300"}
                  >
                    <td className="py-3 font-mono text-xs flex items-center gap-2">
                      {/* Näytetään tähti vain, jos kyseessä EI ole käyttäjä itse */}
                      {!isMe ? (
                        <button
                          onClick={() => toggleFollow(player.name)}
                          className="hover:scale-125 transition-transform"
                        >
                          {isFollowed ? "⭐" : "☆"}
                        </button>
                      ) : (
                        <span className="w-[18px]"></span> // Täyte-elementti, jotta numerot pysyvät linjassa
                      )}
                      {index + 1}.
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
