// // import Auction from "../models/Auction.js";
// // import Player from "../models/Player.js";
// // import Team from "../models/Team.js";
// // import { Server } from "socket.io";
// // import http from "http";
// // import express from "express";
// // import cors from "cors";

// // const app = express();
// // app.use(cors());

// // const server = http.createServer(app);

// // const io = new Server(server, {
// //   cors: {
// //     origin: "http://localhost:3000", // ALLOW frontend
// //     methods: ["GET", "POST"],
// //   },
// // });

// // export const setupAuctionSocket = (io) => {
// //   let currentPlayer = null;
// //   let timer = null;

// //   io.on("connection", (socket) => {
// //     console.log("Client connected");

// //     socket.on("start-auction", async () => {
// //       const player = await Player.findOne({ isSold: false });
// //       console.log("Starting auction - found player:", player);

// //       if (!player) return socket.emit("auction-end");
// //       currentPlayer = player;
// //       io.emit("new-player", player);
// //     });

// //     socket.on("place-bid", async ({ teamId, amount }) => {
// //       if (!currentPlayer) return;

// //       const team = await Team.findById(teamId);
// //       if (amount > team.purse) return;

// //       // Save auction bid
// //       io.emit("new-bid", { teamId, amount });
// //     });

// //     socket.on("finalize-auction", async ({ teamId, amount }) => {
// //       const team = await Team.findById(teamId);
// //       const player = await Player.findById(currentPlayer._id);

// //       player.isSold = true;
// //       player.soldTo = teamId;
// //       player.soldPrice = amount;
// //       await player.save();

// //       team.players.push(player._id);
// //       team.purse -= amount;
// //       await team.save();

// //       io.emit("player-sold", { player, team });
// //       currentPlayer = null;
// //     });
// //   });
// // };

// import Auction from "../models/Auction.js";
// import Player from "../models/Player.js";
// import Team from "../models/Team.js";
// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
// import cors from "cors";

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000", // ALLOW frontend
//     methods: ["GET", "POST"],
//   },
// });

// export const setupAuctionSocket = (io) => {
//   let currentPlayer = null;
//   let timer = null;

//   io.on("connection", (socket) => {
//     console.log("Client connected");

//     socket.on("start-auction", async () => {
//       const player = await Player.findOne({ isSold: false });
//       console.log("Starting auction - found player:", player);

//       if (!player) return socket.emit("auction-end");
//       currentPlayer = player;
//       io.emit("new-player", player);
//     });

//     socket.on("place-bid", async ({ teamId, amount }) => {
//       if (!currentPlayer) return;

//       const team = await Team.findById(teamId);
//       if (amount > team.purse) return;

//       // Save auction bid
//       io.emit("new-bid", { teamId, amount });
//     });

//     // In your auctionSocket.js - make sure players are marked properly
//     socket.on("finalize-auction", async ({ teamId, amount, playerId }) => {
//       const player = await Player.findById(playerId);
//       const team = await Team.findById(teamId);

//       // Mark player as sold
//       player.isSold = true;
//       player.soldTo = teamId;
//       player.soldPrice = amount;
//       await player.save();

//       // Add to team and update budget
//       team.players.push(playerId);
//       team.purse -= amount;
//       await team.save();

//       io.emit("player-sold", { player, team });
//     });

//     // In your auctionSocket.js - make sure to handle unsold players
//     socket.on("unsold-player", async (playerId) => {
//       const player = await Player.findById(playerId);
//       if (!player) return;

//       // Mark player as unsold
//       player.isSold = false;
//       await player.save();

//       io.emit("player-unsold", player);
//     });

//     // Make sure your start-auction only returns unsold players
//     socket.on("start-auction", async () => {
//       const player = await Player.findOne({ isSold: false });
//       if (!player) return socket.emit("auction-end");
//       io.emit("new-player", player);
//     });
//   });
// };

import Auction from "../models/Auction.js";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

export const setupAuctionSocket = (io) => {
  let currentPlayer = null;
  let isContinuousMode = false;
  let auctionEndTime = null;
  let currentHighestBid = 0;
  let currentHighestBidder = null;

  const startNextAuction = async () => {
    const player = await Player.findOne({
      isSold: false,
      isAlreadyAuctioned: false,
    });

    console.log("Starting next auction - found player:", player);

    if (!player) {
      currentPlayer = null;
      isContinuousMode = false;
      auctionEndTime = null;
      io.emit("auction-end");
      return;
    }

    currentPlayer = player;
    currentHighestBid = player.basePrice;
    currentHighestBidder = null;
    auctionEndTime = Date.now() + 30000; // 30 seconds from now

    io.emit("new-player", { 
      player, 
      auctionEndTime,
      highestBid: currentHighestBid 
    });
  };

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("start-auction", async () => {
      isContinuousMode = true;
      console.log("Starting auction...");
      await startNextAuction();
    });

    socket.on("stop-continuous-auction", () => {
      console.log("Stopping continuous auction mode...");
      isContinuousMode = false;
      // We don't stop the current auction, just the loop.
    });

    socket.on("request-current-state", async () => {
      if (currentPlayer) {
        socket.emit("current-state", {
          player: currentPlayer,
          auctionEndTime,
          highestBid: currentHighestBid,
          highestBidder: currentHighestBidder,
          isContinuousMode
        });
      }
    });

    socket.on("place-bid", async ({ teamId, amount }) => {
      if (!currentPlayer) return;

      const team = await Team.findById(teamId);
      if (!team || amount > team.purse) return;

      currentHighestBid = amount;
      currentHighestBidder = teamId;
      auctionEndTime = Date.now() + 30000; // Reset timer on bid

      console.log("Broadcasting new bid:", { teamId, amount });
      io.emit("new-bid", { 
        teamId, 
        amount,
        auctionEndTime 
      });
    });

    socket.on("force-sold", async ({ teamId, amount }) => {
       if (!currentPlayer) return;
       // Trigger finalization immediately
       await finalizeAuction(teamId, amount, currentPlayer._id);
    });

    socket.on("force-unsold", async () => {
       if (!currentPlayer) return;
       await handleUnsold(currentPlayer._id);
    });

    socket.on("finalize-auction", async ({ teamId, amount, playerId }) => {
      await finalizeAuction(teamId, amount, playerId);
    });

    socket.on("unsold-player", async ({ playerId }) => {
      await handleUnsold(playerId);
    });

    const finalizeAuction = async (teamId, amount, playerId) => {
      if (!currentPlayer || currentPlayer._id.toString() !== playerId.toString()) {
        console.log("Finalize mismatch:", { 
           current: currentPlayer?._id, 
           received: playerId 
        });
        return;
      }

      const player = await Player.findById(playerId);
      const team = await Team.findById(teamId);

      if (!player || !team) return;

      player.isSold = true;
      player.soldTo = teamId;
      player.soldPrice = amount;
      player.isAlreadyAuctioned = true;
      await player.save();

      team.players.push(playerId);
      team.purse -= amount;
      await team.save();

      io.emit("player-sold", { player, team });
      
      currentPlayer = null;
      auctionEndTime = null;

      if (isContinuousMode) {
        setTimeout(startNextAuction, 3000);
      }
    };

    const handleUnsold = async (playerId) => {
      if (!currentPlayer || currentPlayer._id.toString() !== playerId.toString()) {
         console.log("Unsold mismatch:", { 
           current: currentPlayer?._id, 
           received: playerId 
        });
        return;
      }

      const player = await Player.findById(playerId);
      if (!player) return;

      player.isSold = false;
      player.isAlreadyAuctioned = true;
      await player.save();

      io.emit("player-unsold", { player });

      currentPlayer = null;
      auctionEndTime = null;

      if (isContinuousMode) {
        setTimeout(startNextAuction, 3000);
      }
    };

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
