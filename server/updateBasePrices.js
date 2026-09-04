import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "./models/Player.js";
import Auction from "./models/Auction.js";
import connectDB from "./config/db.js";

dotenv.config();

// Rating-based base price: rating 85 -> ~35, rating 99 -> ~105
const priceForRating = (rating) => Math.max(10, Math.round((rating - 80) * 5 + 10));

const run = async () => {
  try {
    await connectDB();

    const players = await Player.find();
    let updated = 0;
    for (const p of players) {
      const newPrice = priceForRating(p.rating);
      if (p.basePrice !== newPrice) {
        p.basePrice = newPrice;
        await p.save();
        updated++;
      }
      console.log(`${p.name} (rating ${p.rating}): base price -> ${p.basePrice}`);
    }

    // Clear stale live-auction state (old highest bids are on the wrong scale)
    const cleared = await Auction.deleteMany({});
    console.log(`\nUpdated ${updated} players. Cleared ${cleared.deletedCount} live auction state(s).`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();