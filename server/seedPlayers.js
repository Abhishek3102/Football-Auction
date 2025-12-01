import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "./models/Player.js";
import connectDB from "./config/db.js";

dotenv.config();

const players = [
  { name: "Lionel Messi", position: "Forward", rating: 93, basePrice: 100 },
  { name: "Cristiano Ronaldo", position: "Forward", rating: 92, basePrice: 100 },
  { name: "Kevin De Bruyne", position: "Midfielder", rating: 91, basePrice: 90 },
  { name: "Kylian Mbappé", position: "Forward", rating: 91, basePrice: 110 },
  { name: "Virgil van Dijk", position: "Defender", rating: 90, basePrice: 85 },
  { name: "Erling Haaland", position: "Forward", rating: 91, basePrice: 120 },
  { name: "Neymar Jr", position: "Forward", rating: 89, basePrice: 95 },
  { name: "Mohamed Salah", position: "Forward", rating: 89, basePrice: 90 },
  { name: "Robert Lewandowski", position: "Forward", rating: 91, basePrice: 95 },
  { name: "Harry Kane", position: "Forward", rating: 89, basePrice: 90 },
];

const seedPlayers = async () => {
  try {
    await connectDB();

    // Check if players already exist
    const count = await Player.countDocuments();
    if (count > 0) {
      console.log("Players already exist, skipping seed.");
      process.exit();
    }

    await Player.insertMany(players);
    console.log("Players Seeded!");
    process.exit();
  } catch (error) {
    console.error("Error seeding players:", error);
    process.exit(1);
  }
};

seedPlayers();
