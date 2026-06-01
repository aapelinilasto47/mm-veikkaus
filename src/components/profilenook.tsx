"use client";

import { useState } from "react";
import UsernameEditor from "./usernameeditor";

export default function ProfileNook({
  sessionUser,
  currentUsername,
}: {
  sessionUser: { name?: string | null; email?: string | null };
  currentUsername?: string;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800/80 px-3 py-1.5 rounded-xl shadow-md">
        {/* Nimi / Nimimerkki ja ratas-nappi */}
        <div className="text-sm flex items-center gap-1.5">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="font-bold text-white hover:text-blue-400 flex items-center gap-1 transition-colors outline-none"
          >
            <span>{currentUsername || sessionUser.name}</span>
          </button>
        </div>

        {/* Pystyerotin */}
        <div className="h-4 w-[1px] bg-gray-800"></div>

        {/* Kirjaudu ulos -linkki */}
        <a
          href="/api/auth/signout"
          className="text-xs font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors"
        >
          Ulos
        </a>
      </div>

      {/* Se alasvetovalikko nimimerkin muuttamiseen */}
      <UsernameEditor
        currentUsername={currentUsername}
        isOpen={isDropdownOpen}
        setIsOpen={setIsDropdownOpen}
      />
    </div>
  );
}
