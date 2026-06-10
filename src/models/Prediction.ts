import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true },
    userId: { type: String, required: true },
    choice: { type: String, required: true },
    homeScore: { type: Number, required: true },
    awayScore: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Prediction ||
  mongoose.model("Prediction", PredictionSchema);
