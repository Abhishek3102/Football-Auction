import Team from "../models/Team.js";
import Player from "../models/Player.js";

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate("players");
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { name, purse } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }
    if (!Number.isFinite(Number(purse)) || purse <= 0) {
      return res.status(400).json({ message: "Purse must be a positive number" });
    }

    const existing = await Team.findOne({
      name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ message: "A team with this name already exists" });
    }

    const team = new Team({ name: name.trim(), purse: Number(purse) });
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Release any owned players back to the pool
    await Player.updateMany(
      { soldTo: team._id },
      { $set: { isSold: false, soldTo: null, soldPrice: null, soldAt: null, isAlreadyAuctioned: false } }
    );

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: "Team deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
