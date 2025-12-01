import mongoose from "mongoose";
import Player from "./models/Player.js";
import dotenv from "dotenv";

dotenv.config();

const removeDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    const players = await Player.find({});
    const seenNames = new Set();
    const duplicates = [];

    for (const player of players) {
      // Normalize name: lowercase, remove special chars, trim
      const normalizedName = player.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (seenNames.has(normalizedName)) {
        duplicates.push(player._id);
      } else {
        seenNames.add(normalizedName);
      }
    }

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicates. Removing...`);
      await Player.deleteMany({ _id: { $in: duplicates } });
      console.log("Duplicates removed.");
    } else {
      console.log("No duplicates found.");
    }

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
};

removeDuplicates();
