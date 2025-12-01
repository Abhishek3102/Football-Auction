import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  isLive: Boolean,
  bidHistory: [
    {
      team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      amount: Number,
      timestamp: Date,
    },
  ],
});

export default mongoose.model("Auction", auctionSchema);
