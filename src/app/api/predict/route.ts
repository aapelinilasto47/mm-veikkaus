import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Prediction from "../../../models/Prediction";
import { getServerSession } from "next-auth/next";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { matchId, choice, homeScore, awayScore } = body;
    const userId = session.user.email;

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
