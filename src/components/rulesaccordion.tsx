"use client";

import { useState } from "react";

export default function RulesAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">
            Säännöt & Pisteytys
          </span>
        </div>
        <span className="text-gray-400 text-xs">
          {isOpen ? "Sulje ▲" : "Lue lisää ▼"}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-700 bg-gray-900/30 space-y-4 text-sm sm:text-base text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pisteytys */}
            <div className="space-y-2">
              <h4 className="font-black text-blue-400 uppercase text-xs">
                Pisteiden laskukaava
              </h4>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                <li>
                  <span className="text-rose-500 font-bold">10p</span> – Täysin
                  oikea tulos
                </li>
                <li>
                  <span className="text-emerald-500 font-bold">5p</span> – Oikea
                  voittaja & maalin päässä
                </li>
                <li>
                  <span className="text-emerald-500/80 font-bold">3p</span> –
                  Oikea voittaja (1X2)
                </li>
                <li>
                  <span className="text-gray-500 font-bold">0p</span> – Väärä
                  voittaja
                </li>
              </ul>
            </div>

            {/* Peliaika-sääntö */}
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-700 md:pl-4 pt-2 md:pt-0">
              <h4 className="font-black text-amber-400 uppercase text-xs">
                Tärkeää tietää
              </h4>
              <p className="text-xs leading-relaxed text-gray-400 italic">
                Pisteiden laskeminen suoritetaan tällä hetkellä manuaalisesti,
                joten pisteet päivittyvät otteluiden jälkeen viiveellä.
                Tulevaisuudessa tavoitteena on automatisoida tämä prosessi,
                jotta pisteet näkyisivät reaaliaikaisesti otteluiden päätyttyä.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-2">
            <h4 className="font-black text-amber-400 uppercase text-md mt-4">
              Pudotuspeleissä pisteet tuplataan!
              <br></br>Esimerkiksi täysosuma 10p → 20p.
            </h4>
          </div>

          <div className="text-[10px] text-gray-500 text-center pt-2 uppercase tracking-widest border-t border-gray-800">
            Veikkaus on lukittava ennen ottelun alkamisaikaa.
          </div>
        </div>
      )}
    </div>
  );
}
