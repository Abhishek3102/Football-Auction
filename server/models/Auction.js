import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  isLive: { type: Boolean, default: false },
  highestBid: { type: Number, default: 0 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  endsAt: { type: Date, default: null },
  result: {
    type: { type: String, enum: ["sold", "unsold", null], default: null },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    amount: { type: Number, default: null },
  },
  bidHistory: [
    {
      team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      amount: Number,
      timestamp: Date,
    },
  ],
});

export default mongoose.model("Auction", auctionSchema);
