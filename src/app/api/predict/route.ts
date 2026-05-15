import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Prediction from "../../../models/Prediction";
import Match from "../../../models/Match";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { matchId, choice, homeScore, awayScore } = body;
    const userId = session.user.email;

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 },
      );
    }

    // --- TÄMÄ ON SE UUSI KOHTA ---
    const now = new Date();
    const startTimeStr = match.startTime.toString();

    // Pakotetaan Suomen aikavyöhyke (+03:00), jos kanta ei sisällä aikavyöhyketietoa
    const formattedStartTime =
      startTimeStr.includes("+") || startTimeStr.includes("Z")
        ? startTimeStr
        : `${startTimeStr}+03:00`;

    const matchStartTime = new Date(formattedStartTime);

    // Tulostetaan palvelimen lokiin, jotta näet terminaalista ajat
    console.log(`Checking match ${match.home} vs ${match.away}`);
    console.log(`Server time: ${now.toISOString()}`);
    console.log(`Match start: ${matchStartTime.toISOString()}`);

    if (now >= matchStartTime) {
      return NextResponse.json(
        { success: false, error: "Cannot predict after match has started" },
        { status: 403 },
      );
    }

    const updatedPrediction = await Prediction.findOneAndUpdate(
      { matchId, userId },
      { choice, homeScore: Number(homeScore), awayScore: Number(awayScore) },
      { new: true, upsert: true },
    );

    return NextResponse.json({ success: true, prediction: updatedPrediction });
  } catch (error) {
    console.error("Error saving prediction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save prediction" },
      { status: 500 },
    );
  }
}
