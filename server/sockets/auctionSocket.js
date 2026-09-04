import Player from "../models/Player.js";
import Team from "../models/Team.js";
import Auction from "../models/Auction.js";

const AUCTION_DURATION_MS = 30000;
const HOST_TOKEN = process.env.HOST_TOKEN || ""; // if set, host actions require this token

// Bid increment rules: under $10M -> $0.5M, $10M-$50M -> $1M, above $50M -> $2M
export const getIncrementAmount = (currentBid) => {
  const pct = Math.round(currentBid * 0.05);
  return Math.max(5, Math.round(pct / 5) * 5); // 5% of bid, rounded to nearest 5, min 5
};

const isHost = (token) => {
  // When no HOST_TOKEN is configured, everyone is a host (dev mode / backwards compat)
  if (!HOST_TOKEN) return true;
  return token === HOST_TOKEN;
};

export const setupAuctionSocket = (io) => {
  let currentPlayer = null;
  let isContinuousMode = false;
  let auctionEndTime = null;
  let currentHighestBid = 0;
  let currentHighestBidder = null;
  let timerInterval = null;
  let liveAuctionDocId = null;

  const broadcastState = () => {
    io.emit("auction-state", {
      player: currentPlayer,
      highestBid: currentHighestBid,
      highestBidder: currentHighestBidder,
      auctionEndTime,
      isContinuousMode,
    });
  };

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerInterval = setInterval(async () => {
      if (!currentPlayer || !auctionEndTime) return;
      const remaining = Math.max(0, auctionEndTime - Date.now());
      io.emit("timer-tick", { remainingMs: remaining, auctionEndTime });
      if (remaining <= 0) {
        clearTimer();
        // Server decides the outcome — no client involvement
        if (currentHighestBidder) {
          await finalizeAuction(currentHighestBidder, currentHighestBid, currentPlayer._id);
        } else {
          await handleUnsold(currentPlayer._id);
        }
      }
    }, 500);
  };

  const startNextAuction = async () => {
    const player = await Player.findOne({
      isSold: false,
      isAlreadyAuctioned: false,
    });

    if (!player) {
      currentPlayer = null;
      isContinuousMode = false;
      auctionEndTime = null;
      liveAuctionDocId = null;
      io.emit("auction-end");
      return;
    }

    currentPlayer = player;
    currentHighestBid = player.basePrice;
    currentHighestBidder = null;
    auctionEndTime = Date.now() + AUCTION_DURATION_MS;

    // Persist live state so a server restart can restore it
    try {
      const doc = await Auction.create({
        currentPlayer: player._id,
        isLive: true,
        highestBid: player.basePrice,
        highestBidder: null,
        endsAt: new Date(auctionEndTime),
        bidHistory: [],
      });
      liveAuctionDocId = doc._id;
    } catch (e) {
      console.error("Failed to persist auction state:", e.message);
    }

    io.emit("new-player", {
      player,
      auctionEndTime,
      highestBid: currentHighestBid,
    });
    startTimer();
  };

  const finalizeAuction = async (teamId, amount, playerId) => {
    if (!currentPlayer || currentPlayer._id.toString() !== playerId.toString()) {
      console.log("Finalize mismatch:", { current: currentPlayer?._id, received: playerId });
      return;
    }
    if (teamId !== currentHighestBidder) {
      console.log("Finalize rejected: bidder is not the highest bidder");
      return;
    }
    if (amount !== currentHighestBid) {
      console.log("Finalize rejected: amount does not match highest bid");
      return;
    }

    const player = await Player.findById(playerId);
    const team = await Team.findById(teamId);
    if (!player || !team) return;

    // Atomic purse deduction — prevents double-spend on concurrent sales
    const updated = await Team.findOneAndUpdate(
      { _id: teamId, purse: { $gte: amount } },
      { $inc: { purse: -amount }, $addToSet: { players: playerId } },
      { new: true }
    );
    if (!updated) {
      console.log("Finalize rejected: insufficient purse");
      return;
    }

    player.isSold = true;
    player.isAlreadyAuctioned = true;
    player.soldTo = teamId;
    player.soldPrice = amount;
    player.soldAt = new Date();
    await player.save();

    if (liveAuctionDocId) {
      try {
        await Auction.findByIdAndUpdate(liveAuctionDocId, {
          isLive: false,
          result: { type: "sold", teamId, amount },
        });
      } catch (_) {}
    }

    io.emit("player-sold", { player, team: updated });

    currentPlayer = null;
    auctionEndTime = null;
    currentHighestBid = 0;
    currentHighestBidder = null;
    liveAuctionDocId = null;
    clearTimer();

    if (isContinuousMode) {
      setTimeout(startNextAuction, 3000);
    }
  };

  const handleUnsold = async (playerId) => {
    if (!currentPlayer || currentPlayer._id.toString() !== playerId.toString()) {
      console.log("Unsold mismatch:", { current: currentPlayer?._id, received: playerId });
      return;
    }

    const player = await Player.findById(playerId);
    if (!player) return;

    player.isSold = false;
    player.isAlreadyAuctioned = true;
    await player.save();

    if (liveAuctionDocId) {
      try {
        await Auction.findByIdAndUpdate(liveAuctionDocId, {
          isLive: false,
          result: { type: "unsold" },
        });
      } catch (_) {}
    }

    io.emit("player-unsold", { player });

    currentPlayer = null;
    auctionEndTime = null;
    currentHighestBid = 0;
    currentHighestBidder = null;
    liveAuctionDocId = null;
    clearTimer();

    if (isContinuousMode) {
      setTimeout(startNextAuction, 3000);
    }
  };

  // Restore a live auction after a server restart
  const restoreLiveAuction = async () => {
    try {
      const live = await Auction.findOne({ isLive: true });
      if (!live) return;
      const player = await Player.findById(live.currentPlayer);
      if (!player || player.isSold) {
        await Auction.findByIdAndUpdate(live._id, { isLive: false });
        return;
      }
      currentPlayer = player;
      currentHighestBid = live.highestBid ?? player.basePrice;
      currentHighestBidder = live.highestBidder ?? null;
      auctionEndTime = live.endsAt ? new Date(live.endsAt).getTime() : Date.now() + AUCTION_DURATION_MS;
      if (auctionEndTime < Date.now()) auctionEndTime = Date.now() + AUCTION_DURATION_MS;
      liveAuctionDocId = live._id;
      console.log("Restored live auction for", player.name);
    } catch (e) {
      console.error("Failed to restore auction state:", e.message);
    }
  };
  restoreLiveAuction();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("start-auction", async ({ hostToken } = {}) => {
      if (!isHost(hostToken)) {
        return socket.emit("auction-error", { message: "Invalid host code" });
      }
      if (currentPlayer) {
        return socket.emit("auction-error", { message: "An auction is already live" });
      }
      isContinuousMode = true;
      await startNextAuction();
    });

    socket.on("stop-continuous-auction", ({ hostToken } = {}) => {
      if (!isHost(hostToken)) {
        return socket.emit("auction-error", { message: "Invalid host code" });
      }
      isContinuousMode = false;
    });

    socket.on("request-current-state", () => {
      socket.emit("current-state", {
        player: currentPlayer,
        auctionEndTime,
        highestBid: currentHighestBid,
        highestBidder: currentHighestBidder,
        isContinuousMode,
      });
    });

    socket.on("place-bid", async ({ teamId, amount }) => {
      if (!currentPlayer) {
        return socket.emit("bid-rejected", { message: "No player is on the block right now" });
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return socket.emit("bid-rejected", { message: "Team not found" });
      }

      const minBid = currentHighestBidder
        ? currentHighestBid + getIncrementAmount(currentHighestBid)
        : currentPlayer.basePrice;

      if (amount < minBid) {
        return socket.emit("bid-rejected", {
          message: `Bid too low. Minimum bid is $${minBid.toLocaleString()}`,
          minBid,
        });
      }
      if (amount > team.purse) {
        return socket.emit("bid-rejected", {
          message: `${team.name} cannot afford $${amount.toLocaleString()}`,
        });
      }

      currentHighestBid = amount;
      currentHighestBidder = teamId;
      auctionEndTime = Date.now() + AUCTION_DURATION_MS;

      if (liveAuctionDocId) {
        try {
          await Auction.findByIdAndUpdate(liveAuctionDocId, {
            highestBid: amount,
            highestBidder: teamId,
            endsAt: new Date(auctionEndTime),
            $push: { bidHistory: { team: teamId, amount, timestamp: new Date() } },
          });
        } catch (e) {
          console.error("Failed to record bid:", e.message);
        }
      }

      io.emit("new-bid", {
        teamId,
        teamName: team.name,
        amount,
        auctionEndTime,
      });
    });

    socket.on("force-sold", async ({ hostToken } = {}) => {
      if (!isHost(hostToken)) {
        return socket.emit("auction-error", { message: "Invalid host code" });
      }
      if (!currentPlayer || !currentHighestBidder) return;
      await finalizeAuction(currentHighestBidder, currentHighestBid, currentPlayer._id);
    });

    socket.on("force-unsold", async ({ hostToken } = {}) => {
      if (!isHost(hostToken)) {
        return socket.emit("auction-error", { message: "Invalid host code" });
      }
      if (!currentPlayer) return;
      await handleUnsold(currentPlayer._id);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
