"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Gavel, Play, Square, Plus } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export default function AuctionPage() {
  const [socket, setSocket] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [bidHistory, setBidHistory] = useState([]);
  const [timer, setTimer] = useState(30);
  const [isAuctionLive, setIsAuctionLive] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [highestBid, setHighestBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [playerStatus, setPlayerStatus] = useState(null);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);

  const processedPlayersRef = useRef(new Set());
  const isProcessingRef = useRef(false);

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech to avoid overlap pile-up, or let it queue. 
      // For an auction, queuing is better so we don't miss a bid, but if it gets too behind we might want to cancel.
      // Let's try queuing first (default behavior).
      const utterance = new SpeechSynthesisUtterance(text);
      // Optional: Adjust rate/pitch for excitement
      utterance.rate = 1.1;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };


  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    fetchTeams();

    newSocket.on("connect", () => {
      console.log("Connected to server, requesting state...");
      newSocket.emit("request-current-state");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    newSocket.on("current-state", (state) => {
      console.log("Received current state:", state);
      if (state.player) {
        setCurrentPlayer(state.player);
        setIsAuctionLive(true);
        setHighestBid(state.highestBid || state.player.basePrice);
        setHighestBidder(state.highestBidder);
        setIsContinuousMode(state.isContinuousMode);

        if (state.auctionEndTime) {
          const remainingTime = Math.max(0, Math.ceil((state.auctionEndTime - Date.now()) / 1000));
          setTimer(remainingTime);
        }
      }
    });

    newSocket.on("new-player", (data) => {
      // Handle both old format (player object) and new format ({ player, auctionEndTime, highestBid })
      const player = data.player || data;
      const endTime = data.auctionEndTime;
      const startBid = data.highestBid || player.basePrice;

      console.log("New player received:", player);

      if (processedPlayersRef.current.has(player._id) || isProcessingRef.current) {
        console.log("Skipping already processed player:", player.name);
        return;
      }

      isProcessingRef.current = true;

      setCurrentPlayer(player);
      setIsAuctionLive(true);
      setBidHistory([]);
      setHighestBid(startBid);
      setHighestBidder(null);
      setPlayerStatus(null);

      if (endTime) {
        setTimer(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
      } else {
        setTimer(30);
      }

      speak(`Next player is ${player.name}, ${player.position}. Base price ${player.basePrice} million.`);

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    });

    newSocket.on("new-bid", (data) => {
      console.log("New bid received:", data);
      setBidHistory((prev) => [...prev, { teamId: data.teamId, amount: data.amount }]);
      setHighestBid(data.amount);
      setHighestBidder(data.teamId);

      if (data.auctionEndTime) {
        setTimer(Math.max(0, Math.ceil((data.auctionEndTime - Date.now()) / 1000)));
      } else {
        setTimer(30);
      }

      speak(`Bid of ${data.amount} million.`);
    });

    newSocket.on("player-sold", (data) => {
      console.log("Player sold:", data);

      // Check if we already have this specific sold record
      const alreadySold = soldPlayers.some(p => p._id === data.player._id);
      if (alreadySold) {
        console.log("Player already in sold list, skipping update");
        return;
      }

      setPlayerStatus("sold");
      speak(`Sold to ${data.team.name} for ${data.soldPrice || data.player.soldPrice} million!`);
      processedPlayersRef.current.add(data.player._id);

      setSoldPlayers((prev) => {
        const exists = prev.some((p) => p._id === data.player._id);
        if (!exists) {
          return [
            ...prev,
            {
              ...data.player,
              soldTo: data.team.name,
              soldPrice: data.soldPrice || data.player.soldPrice,
            },
          ];
        }
        return prev;
      });

      fetchTeams();
    });

    newSocket.on("player-unsold", (data) => {
      console.log("Player unsold:", data);

      const alreadyUnsold = unsoldPlayers.some(p => p._id === data.player._id);
      if (alreadyUnsold) return;

      setPlayerStatus("unsold");
      speak(`Player ${data.player.name} remains unsold.`);
      processedPlayersRef.current.add(data.player._id);

      setUnsoldPlayers((prev) => {
        const exists = prev.some((p) => p._id === data.player._id);
        if (!exists) return [...prev, data.player];
        return prev;
      });

      // Clear current player to prevent stale UI
      setCurrentPlayer(null);
    });

    newSocket.on("auction-end", () => {
      console.log("Auction ended");
      setIsAuctionLive(false);
      setCurrentPlayer(null);
      setIsContinuousMode(false);
      setPlayerStatus(null);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    let interval;
    if (isAuctionLive && timer > 0 && playerStatus === null) {
      interval = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    } else if (timer === 0 && isAuctionLive && playerStatus === null) {
      if (highestBidder) {
        finalizeAuction();
      } else {
        handlePlayerUnsold();
      }
    }
    return () => clearInterval(interval);
  }, [timer, isAuctionLive, playerStatus, highestBidder]);

  useEffect(() => {
    let timeout;
    if (playerStatus && isContinuousMode && socket) {
      timeout = setTimeout(() => {
        console.log("Moving to next player...");
        setPlayerStatus(null);
        // We don't emit start-auction here anymore, the server handles the loop
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [playerStatus, isContinuousMode, socket]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`);
      const data = await response.json();
      console.log("Teams fetched:", data);
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    }
  };

  const startAuction = () => {
    console.log("Starting auction...");
    if (socket) {
      setIsContinuousMode(true);
      processedPlayersRef.current.clear();
      setSoldPlayers([]);
      setUnsoldPlayers([]);
      socket.emit("start-auction");
      console.log("Start auction event emitted");
    } else {
      console.error("Socket not connected");
    }
  };

  const breakAuction = () => {
    console.log("Breaking auction...");
    // Just signal server to stop the loop, don't kill local state immediately
    if (socket) {
      socket.emit("stop-continuous-auction");
    }
    setIsContinuousMode(false);
  };

  const getIncrementAmount = (currentBid) => {
    return currentBid < 10 ? 0.5 : 1;
  };

  const placeBid = () => {
    if (socket && selectedTeam && currentPlayer) {
      const increment = getIncrementAmount(highestBid);
      const newBid = highestBid + increment;
      const teamData = teams.find((t) => t._id === selectedTeam);
      if (teamData && newBid <= teamData.purse) {
        console.log("Placing bid:", { teamId: selectedTeam, amount: newBid });
        socket.emit("place-bid", { teamId: selectedTeam, amount: newBid });
      }
    }
  };

  const handlePlayerUnsold = () => {
    console.log("Emitting unsold-player event for player:", currentPlayer?._id);
    if (!currentPlayer || processedPlayersRef.current.has(currentPlayer._id)) {
      console.log("Player already processed as unsold or no current player, skipping");
      return;
    }

    setPlayerStatus("unsold");
    processedPlayersRef.current.add(currentPlayer._id);
    setUnsoldPlayers((prev) => {
      const exists = prev.some((p) => p._id === currentPlayer._id);
      if (!exists) return [...prev, currentPlayer];
      return prev;
    });

    if (socket) {
      socket.emit("unsold-player", { playerId: currentPlayer._id });
      console.log("unsold-player event emitted:", { playerId: currentPlayer._id });
    }

    // Clear current player immediately
    setCurrentPlayer(null);
  };

  const finalizeAuction = () => {
    console.log("Finalizing auction");
    if (processedPlayersRef.current.has(currentPlayer._id)) {
      console.log("Player already processed, skipping finalization");
      return;
    }

    if (socket && highestBidder && currentPlayer) {
      socket.emit("finalize-auction", {
        teamId: highestBidder,
        amount: highestBid,
        playerId: currentPlayer._id,
      });
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find((t) => t._id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const getSelectedTeamBudget = () => {
    const team = teams.find((t) => t._id === selectedTeam);
    return team ? team.purse : 0;
  };

  const canPlaceBid = () => {
    if (!selectedTeam || !currentPlayer || playerStatus !== null) return false;
    const increment = getIncrementAmount(highestBid);
    const newBid = highestBid + increment;
    return newBid <= getSelectedTeamBudget();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/auction page.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/70 z-10" />

      <div className="container mx-auto p-4 pt-24 relative z-20">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Live Auction</h1>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Badge variant={isAuctionLive ? "destructive" : "secondary"} className="text-lg px-4 py-2">
              {isAuctionLive ? "LIVE" : "OFFLINE"}
            </Badge>
            {isContinuousMode && <Badge className="bg-green-600 text-lg px-4 py-2">CONTINUOUS MODE</Badge>}
            <div className="flex gap-2">
              {!isContinuousMode && !isAuctionLive && (
                <Button onClick={startAuction} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Continuous Auction
                </Button>
              )}
              {isContinuousMode && (
                <Button onClick={breakAuction} className="bg-red-600 hover:bg-red-700">
                  <Square className="h-4 w-4 mr-2" />
                  Break Auction
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{soldPlayers.length}</div>
              <div className="text-sm text-gray-300">Sold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{unsoldPlayers.length}</div>
              <div className="text-sm text-gray-300">Unsold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                ${soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-300">Total Value</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence>
              {currentPlayer && (
                <motion.div
                  key={currentPlayer._id} // Ensure unique key for animation
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    className={`border-0 text-white mb-6 overflow-hidden relative ${playerStatus === "sold"
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : playerStatus === "unsold"
                        ? "bg-gradient-to-br from-red-500 to-red-600"
                        : "bg-black"
                      }`}
                  >
                    {/* Video Background for Card */}
                    {playerStatus === null && (
                      <>
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-50"
                        >
                          <source
                            src={
                              currentPlayer.position === "Goalkeeper"
                                ? "/goalkeeper video.mp4"
                                : currentPlayer.position === "Defender"
                                  ? "/defender.mp4"
                                  : currentPlayer.position === "Midfielder"
                                    ? "/midfielder.mp4"
                                    : "/striker.mp4"
                            }
                            type="video/mp4"
                          />
                        </video>
                        <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10" />
                      </>
                    )}

                    <CardHeader className="relative z-20">
                      <CardTitle className="text-3xl text-center">
                        {playerStatus === "sold" ? "SOLD!" : playerStatus === "unsold" ? "UNSOLD!" : "Current Player"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center relative z-20">
                      <div className="mb-4">
                        <h2 className="text-4xl font-bold mb-2">{currentPlayer.name}</h2>
                        <p className="text-xl">{currentPlayer.position}</p>
                        <div className="flex justify-center items-center gap-4 mt-4">
                          <Badge className="bg-white text-black text-lg px-3 py-1">
                            Rating: {currentPlayer.rating}
                          </Badge>
                          <Badge className="bg-white text-black text-lg px-3 py-1">
                            Base: ${currentPlayer.basePrice.toLocaleString()}
                          </Badge>
                        </div>
                      </div>

                      {playerStatus === null && (
                        <motion.div
                          animate={{ scale: timer <= 10 ? [1, 1.1, 1] : 1 }}
                          transition={{ repeat: timer <= 10 ? Number.POSITIVE_INFINITY : 0, duration: 0.5 }}
                          className="mb-4"
                        >
                          <div className={`text-6xl font-bold ${timer <= 10 ? "text-red-300" : "text-white"}`}>
                            {timer}s
                          </div>
                        </motion.div>
                      )}

                      <div className="bg-white/20 rounded-lg p-4">
                        <h3 className="text-2xl font-bold mb-2">
                          {playerStatus === "sold"
                            ? "Final Price"
                            : playerStatus === "unsold"
                              ? "Highest Bid Reached"
                              : "Current Highest Bid"}
                        </h3>
                        <div className="text-4xl font-bold text-green-300">${highestBid.toLocaleString()}</div>
                        {highestBidder && (
                          <p className="text-lg mt-2">
                            {playerStatus === "sold" ? "Sold to" : "by"} {getTeamName(highestBidder)}
                          </p>
                        )}
                        {playerStatus === "unsold" && !highestBidder && (
                          <p className="text-lg mt-2">No bids received</p>
                        )}
                      </div>

                      {playerStatus && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                          {isContinuousMode && <p className="text-lg">Moving to next player in 3 seconds...</p>}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {isContinuousMode && !currentPlayer && (
                <div className="text-white text-center">Loading next player...</div>
              )}
            </AnimatePresence>

            {isAuctionLive && playerStatus === null && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
                      <Gavel className="h-6 w-6" />
                      Place Your Bid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Select Team</label>
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className="w-full bg-white/20 text-white border border-white/30 rounded-md p-3"
                        >
                          <option value="">Choose your team</option>
                          {teams.map((team) => (
                            <option key={team._id} value={team._id} className="text-black">
                              {team.name} (Budget: ${team.purse.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedTeam && (
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-white">
                                ${(highestBid + getIncrementAmount(highestBid)).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-300">Next Bid Amount</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-yellow-400">
                                +${getIncrementAmount(highestBid)}
                              </div>
                              <div className="text-sm text-gray-300">Increment</div>
                            </div>
                          </div>

                          <div className="mt-3 text-center">
                            <div className="text-lg text-white">
                              Team Budget: ${getSelectedTeamBudget().toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-300">
                              Remaining after bid: $
                              {(
                                getSelectedTeamBudget() -
                                (highestBid + getIncrementAmount(highestBid))
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={placeBid}
                        disabled={!canPlaceBid()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        {!selectedTeam
                          ? "Select Team First"
                          : !canPlaceBid()
                            ? "Insufficient Budget"
                            : `Bid $${(highestBid + getIncrementAmount(highestBid)).toLocaleString()}`}
                      </Button>

                      <div className="text-center text-sm text-gray-300">
                        <p>
                          Increment: ${getIncrementAmount(highestBid)}
                          {highestBid < 10 ? " (Under $10)" : " ($10 and above)"}
                        </p>
                      </div>

                      {/* Manual Controls */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <Button
                          onClick={() => socket.emit("force-sold", { teamId: highestBidder, amount: highestBid })}
                          disabled={!highestBidder}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Force Sold
                        </Button>
                        <Button
                          onClick={() => socket.emit("force-unsold")}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Force Unsold
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <motion.div
                      key={team._id}
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-lg p-3 ${selectedTeam === team._id ? "bg-blue-600/30 border border-blue-400" : "bg-white/10"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{team.name}</span>
                        <Badge className="bg-green-600">${team.purse.toLocaleString()}</Badge>
                      </div>
                      <div className="text-sm text-gray-300 mt-1">Players: {team.players?.length || 0}</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {bidHistory.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Bid History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bidHistory
                      .slice()
                      .reverse()
                      .map((bid, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/10 rounded-lg p-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white text-sm">{getTeamName(bid.teamId)}</span>
                            <Badge className="bg-blue-600">${bid.amount.toLocaleString()}</Badge>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(soldPlayers.length > 0 || unsoldPlayers.length > 0) && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Recent Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {soldPlayers
                      .slice(-5)
                      .reverse()
                      .map((player, index) => (
                        <motion.div
                          key={`sold-${player._id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-green-600/20 rounded-lg p-2 border border-green-500/30"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-white text-sm font-medium">{player.name}</span>
                              <div className="text-xs text-green-300">Sold to {player.soldTo}</div>
                            </div>
                            <Badge className="bg-green-600">${player.soldPrice?.toLocaleString()}</Badge>
                          </div>
                        </motion.div>
                      ))}

                    {unsoldPlayers
                      .slice(-3)
                      .reverse()
                      .map((player, index) => (
                        <motion.div
                          key={`unsold-${player._id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-red-600/20 rounded-lg p-2 border border-red-500/30"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-white text-sm font-medium">{player.name}</span>
                              <div className="text-xs text-red-300">Unsold</div>
                            </div>
                            <Badge className="bg-red-600">UNSOLD</Badge>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
