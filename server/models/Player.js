import mongoose from "mongoose";

const POSITION_VALUES = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  position: {
    type: String,
    required: true,
    enum: POSITION_VALUES,
  },
  rating: { type: Number, required: true, min: 1, max: 99 },
  basePrice: { type: Number, required: true, min: 0 },
  isSold: { type: Boolean, default: false },
  isAlreadyAuctioned: { type: Boolean, default: false },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  soldPrice: { type: Number, default: null },
  soldAt: { type: Date, default: null },
});

export default mongoose.model("Player", playerSchema);
