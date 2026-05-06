"use client";

import { set } from "mongoose";
import { useState } from "react";

export default function BettingButtons({
  matchId,
  initialChoice,
}: {
  matchId: string;
  initialChoice: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(initialChoice);
  const [loading, setLoading] = useState(false);

  const handleClick = async (choice: string) => {
    setLoading(true);
    setSelected(choice);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          userId: "test-user",
          choice,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      console.log("Prediction saved successfully");
    } catch (error) {
      console.error("Error saving prediction:", error);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  const btnClass = (choice: string) => `
    px-4 py-2 rounded-lg font-bold transition-all duration-200
    ${
      selected === choice
        ? "bg-blue-600 text-white scale-105 shadow-lg shadow-blue-900"
        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
    }
    ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
  `;

  return (
    <div className="flex gap-2 mt-4 justify-center">
      <button
        onClick={() => handleClick("1")}
        disabled={loading}
        className={btnClass("1")}
      >
        1
      </button>
      <button
        onClick={() => handleClick("X")}
        disabled={loading}
        className={btnClass("X")}
      >
        X
      </button>
      <button
        onClick={() => handleClick("2")}
        disabled={loading}
        className={btnClass("2")}
      >
        2
      </button>
    </div>
  );
}
