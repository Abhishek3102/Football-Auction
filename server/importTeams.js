import mongoose from "mongoose";
import dotenv from "dotenv";
import Team from "./models/Team.js";

dotenv.config();

const teams = [
  { name: "Manchester United", purse: 300, players: [] },
  { name: "FC Barcelona", purse: 300, players: [] },
  { name: "Real Madrid", purse: 300, players: [] },
  { name: "Chelsea", purse: 300, players: [] },
  { name: "Manchester City", purse: 300, players: [] },
  { name: "Liverpool", purse: 300, players: [] },
  { name: "Arsenal", purse: 300, players: [] },
  { name: "PSG", purse: 300, players: [] },
  { name: "Bayern Munich", purse: 300, players: [] },
  { name: "AC Milan", purse: 300, players: [] },
];

const importTeams = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await Team.deleteMany(); // clear old data
    await Team.insertMany(teams);

    console.log("Teams imported successfully!");
    process.exit();
  } catch (error) {
    console.error("Error importing teams:", error);
    process.exit(1);
  }
};

importTeams();
