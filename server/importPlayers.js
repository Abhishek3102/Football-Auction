import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "./models/Player.js";
dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    importPlayers();
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  });

function cleanName(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function importPlayers() {
  try {
    const rawData = fs.readFileSync("./players_auction.json", "utf-8");
    let players = JSON.parse(rawData);

    const seen = new Set();
    players = players
      .map((player) => ({
        ...player,
        name: cleanName(player.name),
      }))
      .filter((player) => {
        const key = `${player.name.toLowerCase()}-${player.rating}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    await Player.deleteMany(); // Optional: clear existing
    await Player.insertMany(players);

    console.log("✅ Players imported successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error importing players:", err);
    process.exit(1);
  }
}
