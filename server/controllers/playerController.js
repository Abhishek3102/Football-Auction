import Player from "../models/Player.js";

export const getUnsoldPlayers = async (req, res) => {
  const players = await Player.find({ isSold: false });
  res.json(players);
};

export const createPlayer = async (req, res) => {
  const player = new Player(req.body);
  await player.save();
  res.status(201).json(player);
};
