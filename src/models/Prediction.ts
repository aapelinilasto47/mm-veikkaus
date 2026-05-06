import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true },
    userId: { type: String, required: true },
    choice: { type: String, enum: ["1", "X", "2"], required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Prediction ||
  mongoose.model("Prediction", PredictionSchema);
