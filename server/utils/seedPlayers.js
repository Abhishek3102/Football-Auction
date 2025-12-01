import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "../models/Player.js";
import fs from "fs";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const data = JSON.parse(fs.readFileSync("players.json", "utf-8"));
await Player.insertMany(data);
console.log("Players inserted");
process.exit();
