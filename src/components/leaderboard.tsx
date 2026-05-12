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
  const [searchTerm, setSearchTerm] = useState("");

  // Ladataan suosikit selaimen muistista
  useEffect(() => {
    const saved = localStorage.getItem("followed_players");
    if (saved) setFollowedPlayers(JSON.parse(saved));
  }, []);

  // Suosikin lisäys/poisto
  const toggleFollow = (name: string) => {
    const newFollowed = followedPlayers.includes(name)
      ? followedPlayers.filter((p) => p !== name)
      : [...followedPlayers, name];
    setFollowedPlayers(newFollowed);
    localStorage.setItem("followed_players", JSON.stringify(newFollowed));
  };

  // Suodatetaan lista: huomioi haun, seurattavat ja kirjautumisen
  const displayBoard = sortedLeaderboard.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFollow = showOnlyFollowed
      ? followedPlayers.includes(player.name) ||
        player.name === currentUserEmail
      : true;

    return matchesSearch && matchesFollow;
  });

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
          {/* HAKU JA SUODATUS: Näytetään vain kirjautuneille */}
          {currentUserEmail ? (
            <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-4 border-b border-gray-800">
              {/* Hakukenttä */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Etsi pelaajaa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2 text-gray-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suodatusnapit */}
              <div className="flex gap-2">
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
            </div>
          ) : (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-center">
              <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">
                Kirjaudu sisään etsiäksesi ja seurataksesi kavereitasi!
              </p>
            </div>
          )}

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
              {displayBoard.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-gray-500 text-xs italic"
                  >
                    Pelaajia ei löytynyt.
                  </td>
                </tr>
              ) : (
                /* Jos haetaan tai suodatetaan, näytetään kaikki osumat. Muuten vain Top 20. */
                (searchTerm || showOnlyFollowed
                  ? displayBoard
                  : displayBoard.slice(0, 20)
                ).map((player) => {
                  const actualIndex = sortedLeaderboard.findIndex(
                    (p) => p.name === player.name,
                  );
                  const isMe = player.name === currentUserEmail;
                  const isFollowed = followedPlayers.includes(player.name);

                  return (
                    <tr
                      key={player.name}
                      className={
                        isMe
                          ? "text-yellow-500 bg-yellow-500/5"
                          : "text-gray-300"
                      }
                    >
                      <td className="py-3 font-mono text-xs flex items-center gap-2">
                        {/* Tähti vain kirjautuneille ja muille kuin itselle */}
                        {currentUserEmail && !isMe ? (
                          <button
                            onClick={() => toggleFollow(player.name)}
                            className="hover:scale-125 transition-transform text-sm"
                          >
                            {isFollowed ? "⭐" : "☆"}
                          </button>
                        ) : (
                          <span className="w-4"></span>
                        )}
                        {actualIndex + 1}.
                      </td>
                      <td className="py-3 font-bold truncate max-w-[120px]">
                        {player.name.split("@")[0]} {isMe && "(Sinä)"}
                      </td>
                      <td className="py-3 text-right text-xs">
                        🎯 {player.jackpots}
                      </td>
                      <td className="py-3 text-right font-black text-lg">
                        {player.points}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="mt-4 text-right text-xs text-gray-500">
            Tulostaulukko näyttää 20 pelaajaa. Osallistujia yhteensä:{" "}
            {sortedLeaderboard.length}
          </div>
        </div>
      </details>
    </div>
  );
}
