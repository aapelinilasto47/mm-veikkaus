import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Prediction from "../../../models/Prediction";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { matchId, userId, choice } = body;

    const updatedPrediction = await Prediction.findOneAndUpdate(
      { matchId, userId },
      { choice },
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
