import Player from "../models/Player.js";

export const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().populate("soldTo", "name");
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnsoldPlayers = async (req, res) => {
  try {
    const players = await Player.find({ isSold: false }).populate("soldTo", "name");
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPlayer = async (req, res) => {
  try {
    const { name, position, rating, basePrice } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Player name is required" });
    }
    if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 99) {
      return res.status(400).json({ message: "Rating must be a whole number between 1 and 99" });
    }
    if (!Number.isFinite(Number(basePrice)) || basePrice < 0) {
      return res.status(400).json({ message: "Base price must be a non-negative number" });
    }

    const player = new Player({
      name: name.trim(),
      position,
      rating: Number(rating),
      basePrice: Number(basePrice),
    });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    if (player.isSold) {
      return res.status(400).json({ message: "Cannot delete a sold player. Undo the sale first." });
    }
    await Player.findByIdAndDelete(req.params.id);
    res.json({ message: "Player deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
