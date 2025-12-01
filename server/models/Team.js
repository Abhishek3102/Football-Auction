import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: String,
  purse: Number,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
});

export default mongoose.model("Team", teamSchema);
