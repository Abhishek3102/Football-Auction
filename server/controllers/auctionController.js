import Player from "../models/Player.js";
import Team from "../models/Team.js";

// Aggregated stats so the homepage doesn't need to download every player
export const getStats = async (req, res) => {
  try {
    const [totalPlayers, soldPlayers, totalTeams, valueAgg] = await Promise.all([
      Player.countDocuments(),
      Player.countDocuments({ isSold: true }),
      Team.countDocuments(),
      Player.aggregate([
        { $match: { isSold: true } },
        { $group: { _id: null, totalValue: { $sum: "$soldPrice" } } },
      ]),
    ]);

    res.json({
      totalPlayers,
      soldPlayers,
      totalTeams,
      totalValue: valueAgg[0]?.totalValue || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reverts the most recent sale: player back to pool, purse refunded atomically
export const undoLastSale = async (req, res) => {
  try {
    const player = await Player.findOne({ isSold: true, soldAt: { $ne: null } })
      .sort({ soldAt: -1 });

    if (!player) {
      return res.status(404).json({ message: "No sales to undo" });
    }

    const team = await Team.findById(player.soldTo);
    if (team) {
      await Team.findByIdAndUpdate(team._id, {
        $inc: { purse: player.soldPrice || 0 },
        $pull: { players: player._id },
      });
    }

    player.isSold = false;
    player.soldTo = null;
    player.soldPrice = null;
    player.soldAt = null;
    player.isAlreadyAuctioned = false;
    await player.save();

    res.json({ message: `Sale of ${player.name} undone`, player });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
