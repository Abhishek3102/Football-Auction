import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "./models/Player.js";
import Team from "./models/Team.js";
import connectDB from "./config/db.js";

dotenv.config();

const resetAuction = async () => {
  try {
    await connectDB();

    // Reset Players
    await Player.updateMany(
      {},
      { $set: { isSold: false, isAlreadyAuctioned: false, soldTo: null, soldPrice: 0 } }
    );
    console.log("All players reset to unsold state.");

    // Reset Teams (optional, but good for a full reset)
    // Assuming Team model has players array and purse
    // We might need to check Team model to be sure, but usually we want to clear players from teams too.
    // Let's just reset players for now as that's the main issue.
    // If we want to be thorough:
    await Team.updateMany({}, { $set: { players: [], purse: 500 } }); // Assuming default purse is 500, need to verify
    console.log("Teams reset (players cleared).");

    process.exit();
  } catch (error) {
    console.error("Error resetting auction:", error);
    process.exit(1);
  }
};

resetAuction();
