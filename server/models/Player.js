import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: String,
  position: String,
  rating: Number,
  basePrice: Number,
  isSold: { type: Boolean, default: false },
  isAlreadyAuctioned: { type: Boolean, default: false },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  soldPrice: Number,
});

export default mongoose.model("Player", playerSchema);
