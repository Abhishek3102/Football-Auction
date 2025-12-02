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

export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("players");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
