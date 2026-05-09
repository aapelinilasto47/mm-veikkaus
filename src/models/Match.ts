import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  home: { type: String, required: true },
  homeScore: { type: Number, required: false },
  away: { type: String, required: true },
  awayScore: { type: Number, required: false },
  startTime: { type: Date, required: true },
  isPlayoff: { type: Boolean, default: false },
});

export default mongoose.models.Match || mongoose.model("Match", matchSchema);
