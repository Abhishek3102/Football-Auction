import Team from "../models/Team.js";

export const getTeams = async (req, res) => {
  const teams = await Team.find().populate("players");
  res.json(teams);
};

export const createTeam = async (req, res) => {
  const team = new Team(req.body);
  await team.save();
  res.status(201).json(team);
};
