"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernameEditor({
  currentUsername,
  isOpen,
  setIsOpen,
}: {
  currentUsername?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [inputName, setInputName] = useState(currentUsername || "");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");

    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername: inputName }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg("✓ Päivitetty!");
        router.refresh();
        setTimeout(() => {
          setIsOpen(false);
          setStatusMsg("");
        }, 1200);
      } else {
        setStatusMsg(`${data.message}`);
      }
    } catch (err) {
      setStatusMsg("Virhe.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl p-3 shadow-2xl z-50 text-left animate-in fade-in slide-in-from-top-1 duration-150">
      <p className="text-[10px] text-gray-400 mb-2 leading-normal">
        Aseta julkinen nimimerkki tulostaulukkoon (max 12 merkkiä).
      </p>

      <form onSubmit={saveName} className="flex gap-1.5 justify-start">
        <input
          type="text"
          maxLength={12}
          placeholder="Esim_Koodari"
          value={inputName}
          onChange={(e) =>
            setInputName(e.target.value.replace(/[^a-zA-Z0-9_öäåÖÄÅ]/g, ""))
          }
          className="bg-black/60 border border-gray-700 rounded-lg px-2 py-1 text-xs outline-none text-white font-mono focus:border-blue-500 w-full"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-[10px] uppercase font-black px-3 py-1 rounded-lg transition-all"
        >
          {loading ? "..." : "Ok"}
        </button>
      </form>

      {statusMsg && (
        <p
          className={`text-[9px] mt-1.5 font-bold ${statusMsg.startsWith("✓") ? "text-emerald-400" : "text-rose-400"}`}
        >
          {statusMsg}
        </p>
      )}
    </div>
  );
}
