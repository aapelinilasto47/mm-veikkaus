import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  homeTeam: { type: String, required: true },
  homeScore: { type: Number, required: false },
  awayTeam: { type: String, required: true },
  awayScore: { type: Number, required: false },
  matchTime: { type: Date, required: true },
});

export default mongoose.models.Match || mongoose.model("Match", matchSchema);
