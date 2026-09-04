"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Users,
  Gavel,
  Play,
  Square,
  Volume2,
  VolumeX,
  Lock,
  Undo2,
  Star,
} from "lucide-react";
import { API_BASE_URL, getIncrementAmount } from "@/lib/config";
import { getTeamAssets } from "@/lib/team-utils";

const AUCTION_DURATION_MS = 30000;

// Human-friendly spoken amounts ("5.5 million", not "5500000 million")
const formatMillions = (amount) => {
  const m = amount / 1000000;
  return m >= 1 ? `${m % 1 === 0 ? m : m.toFixed(1)} million` : `${amount.toLocaleString()}`;
};

const getTeamAssetsSafe = (team) =>
  team ? getTeamAssets(team.name) : { logo: null, customGradient: null };

export default function AuctionPage() {
  const [socket, setSocket] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [bidHistory, setBidHistory] = useState([]);
  const [remainingMs, setRemainingMs] = useState(AUCTION_DURATION_MS);
  const [isAuctionLive, setIsAuctionLive] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [highestBid, setHighestBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hostToken, setHostToken] = useState("");
  const [hostTokenInput, setHostTokenInput] = useState("");
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);

  const isHost = () => hostToken.length > 0;

  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const speak = useCallback((text) => {
    if (!voiceEnabledRef.current || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error("Failed to load teams");
    }
  }, []);

  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    fetchTeams();

    newSocket.on("connect", () => {
      newSocket.emit("request-current-state");
    });

    newSocket.on("connect_error", () => {
      toast.error("Cannot reach the auction server");
    });

    newSocket.on("current-state", (state) => {
      if (state.player) {
        setCurrentPlayer(state.player);
        setIsAuctionLive(true);
        setHighestBid(state.highestBid || state.player.basePrice);
        setHighestBidder(state.highestBidder);
        setIsContinuousMode(state.isContinuousMode);
        if (state.auctionEndTime) {
          setRemainingMs(Math.max(0, state.auctionEndTime - Date.now()));
        }
      }
    });

    newSocket.on("new-player", (data) => {
      const player = data.player || data;
      setCurrentPlayer(player);
      setIsAuctionLive(true);
      setBidHistory([]);
      setHighestBid(data.highestBid || player.basePrice);
      setHighestBidder(null);
      if (data.auctionEndTime) {
        setRemainingMs(Math.max(0, data.auctionEndTime - Date.now()));
      } else {
        setRemainingMs(AUCTION_DURATION_MS);
      }
      speak(`Next player is ${player.name}, ${player.position}. Base price ${formatMillions(player.basePrice)}.`);
    });

    newSocket.on("timer-tick", ({ remainingMs: ms }) => {
      setRemainingMs(Math.max(0, ms));
    });

    newSocket.on("new-bid", (data) => {
      setBidHistory((prev) => [...prev, { teamId: data.teamId, teamName: data.teamName, amount: data.amount }]);
      setHighestBid(data.amount);
      setHighestBidder(data.teamId);
      if (data.auctionEndTime) {
        setRemainingMs(Math.max(0, data.auctionEndTime - Date.now()));
      }
      speak(`Bid of ${formatMillions(data.amount)} from ${data.teamName || "a team"}.`);
    });

    newSocket.on("bid-rejected", ({ message }) => {
      toast.error(message || "Bid rejected");
    });

    newSocket.on("auction-error", ({ message }) => {
      toast.error(message || "Auction error");
    });

    newSocket.on("player-sold", (data) => {
      setSoldPlayers((prev) => {
        if (prev.some((p) => p._id === data.player._id)) return prev;
        return [
          ...prev,
          {
            ...data.player,
            soldTo: data.team.name,
            soldPrice: data.player.soldPrice,
          },
        ];
      });
      speak(`Sold to ${data.team.name} for ${formatMillions(data.player.soldPrice)}!`);
      toast.success(`${data.player.name} sold to ${data.team.name}!`);
      fetchTeams();
    });

    newSocket.on("player-unsold", (data) => {
      setUnsoldPlayers((prev) => {
        if (prev.some((p) => p._id === data.player._id)) return prev;
        return [...prev, data.player];
      });
      speak(`Player ${data.player.name} remains unsold.`);
      setCurrentPlayer(null);
      setIsAuctionLive(false);
    });

    newSocket.on("auction-end", () => {
      setIsAuctionLive(false);
      setCurrentPlayer(null);
      setIsContinuousMode(false);
      toast.info("Auction complete - every player has been through the block.");
    });

    return () => newSocket.close();
  }, [fetchTeams, speak]);

  const startAuction = () => {
    if (!isHost()) {
      setIsHostDialogOpen(true);
      return;
    }
    socket.emit("start-auction", { hostToken });
  };

  const stopAuction = () => {
    socket.emit("stop-continuous-auction", { hostToken });
    toast.info("Continuous mode stopped after the current player");
  };

  const placeBid = () => {
    if (!currentPlayer || !selectedTeam) return;
    const amount = highestBid + getIncrementAmount(highestBid);
    socket.emit("place-bid", { teamId: selectedTeam, amount });
  };

  const canPlaceBid = () => {
    const team = teams.find((t) => t._id === selectedTeam);
    if (!team) return false;
    return highestBid + getIncrementAmount(highestBid) <= team.purse;
  };

  const forceSold = () => {
    if (!currentPlayer || !highestBidder) return;
    socket.emit("force-sold", { hostToken });
  };

  const forceUnsold = () => {
    if (!currentPlayer) return;
    socket.emit("force-unsold", { hostToken });
  };

  const undoLastSale = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/undo-last-sale`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setSoldPlayers((prev) => prev.filter((p) => p._id !== data.player._id));
        fetchTeams();
      } else {
        toast.error(data.message || "Nothing to undo");
      }
    } catch {
      toast.error("Failed to undo last sale");
    }
  };

  const unlockHost = () => {
    if (!hostTokenInput.trim()) return;
    setHostToken(hostTokenInput.trim());
    setIsHostDialogOpen(false);
    setHostTokenInput("");
    toast.success("Host controls unlocked");
  };

  const getTeamName = (teamId) => teams.find((t) => t._id === teamId)?.name || "Unknown Team";
  const winningTeam = teams.find((t) => t._id === highestBidder);
  const nextBid = highestBid + getIncrementAmount(highestBid);

  // Countdown ring math
  const progress = Math.min(1, remainingMs / AUCTION_DURATION_MS);
  const seconds = Math.ceil(remainingMs / 1000);
  const RING = 2 * Math.PI * 54;
  const urgent = seconds <= 5 && isAuctionLive && currentPlayer;
  const ringColor = seconds <= 5 ? "#ef4444" : seconds <= 10 ? "#f59e0b" : "#22c55e";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4 pt-24">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-3 flex items-center gap-3"
          >
            <Gavel className="h-10 w-10 text-yellow-400" />
            Live Auction
          </motion.h1>
          <p className="text-lg text-gray-300 mb-4">Real-time bidding, server-verified</p>

          <div className="flex items-center gap-3">
            {!isAuctionLive && !currentPlayer ? (
              <Button
                onClick={startAuction}
                className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 h-auto pulse-glow"
              >
                <Play className="h-5 w-5 mr-2" /> Start Auction
              </Button>
            ) : (
              <Button
                onClick={stopAuction}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <Square className="h-4 w-4 mr-2" /> Stop Continuous Mode
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              aria-label={voiceEnabled ? "Mute auctioneer voice" : "Enable auctioneer voice"}
              onClick={() => {
                if (voiceEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
                setVoiceEnabled(!voiceEnabled);
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Undo last sale"
              onClick={undoLastSale}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Undo2 className="h-4 w-4" />
            </Button>

            <Dialog open={isHostDialogOpen} onOpenChange={setIsHostDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Host controls"
                  className={isHost() ? "border-green-500 text-green-400" : "border-white/20 text-white"}
                >
                  <Lock className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Host Access</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Enter the host code to control the auction.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Host code"
                    value={hostTokenInput}
                    onChange={(e) => setHostTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && unlockHost()}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Button onClick={unlockHost} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    Unlock
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Screen-reader live region for bids */}
        <div aria-live="polite" className="sr-only">
          {currentPlayer
            ? `Current player ${currentPlayer.name}. Highest bid ${highestBid.toLocaleString()}${highestBidder ? ` by ${getTeamName(highestBidder)}` : ""}. ${seconds} seconds remaining.`
            : "No player on the block."}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main auction area */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {currentPlayer ? (
                <motion.div
                  key={currentPlayer._id}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30 }}
                >
                  <Card
                    className={`bg-white/10 backdrop-blur-md border-white/20 ${
                      urgent ? "ring-2 ring-red-500/70" : ""
                    }`}
                  >
                    <CardHeader className="pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-2xl">On the Block</CardTitle>
                        <Badge
                          className={`text-sm px-3 py-1 ${
                            highestBidder ? "bg-green-600" : "bg-blue-600"
                          }`}
                        >
                          {highestBidder
                            ? `Leading: ${getTeamName(highestBidder)}`
                            : "Base Price"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Player identity */}
                        <div className="flex-1 text-center md:text-left">
                          <h2 className="text-4xl font-bold text-white mb-1">{currentPlayer.name}</h2>
                          <p className="text-gray-300 mb-3">{currentPlayer.position}</p>
                          <div className="flex justify-center md:justify-start gap-3">
                            <Badge className="bg-yellow-600 text-white">
                              <Star className="h-3 w-3 mr-1" /> {currentPlayer.rating}
                            </Badge>
                            <Badge className="bg-blue-600 text-white">
                              Base ${currentPlayer.basePrice.toLocaleString()}
                            </Badge>
                          </div>
                        </div>

                        {/* Countdown ring */}
                        <div className="relative w-32 h-32 shrink-0">
                          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle
                              cx="60"
                              cy="60"
                              r="54"
                              fill="none"
                              stroke={ringColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={RING}
                              strokeDashoffset={RING * (1 - progress)}
                              style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.5s" }}
                            />
                          </svg>
                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center ${
                              urgent ? "animate-pulse" : ""
                            }`}
                          >
                            <span
                              className="text-4xl font-bold"
                              style={{ color: ringColor }}
                            >
                              {seconds}
                            </span>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">seconds</span>
                          </div>
                        </div>
                      </div>

                      {/* Current bid */}
                      <div className="mt-6 bg-black/30 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Current Bid</span>
                          <span className="text-3xl font-bold text-yellow-400">
                            ${highestBid.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Bidding controls */}
                      <div className="mt-4 space-y-3">
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2"
                          aria-label="Select bidding team"
                        >
                          <option value="">Select Team</option>
                          {teams.map((team) => (
                            <option key={team._id} value={team._id}>
                              {team.name} — ${team.purse.toLocaleString()}{team.purse < nextBid ? " (can't afford)" : ""}
                            </option>
                          ))}
                        </select>

                        <Button
                          onClick={placeBid}
                          disabled={!selectedTeam || !canPlaceBid()}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-xl py-6 h-auto font-bold"
                        >
                          <Gavel className="h-5 w-5 mr-2" />
                          {!selectedTeam
                            ? "Select Team First"
                            : !canPlaceBid()
                              ? "Insufficient Budget"
                              : `Bid $${nextBid.toLocaleString()}`}
                        </Button>

                        <div className="text-center text-sm text-gray-300">
                          <p>
                            Minimum next bid: <span className="text-white font-medium">${nextBid.toLocaleString()}</span>{" "}
                            (increment ${getIncrementAmount(highestBid).toLocaleString()})
                          </p>
                        </div>

                        {isHost() && (
                          <div className="grid grid-cols-2 gap-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  disabled={!highestBidder}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Force Sold
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sell {currentPlayer.name}?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    {getTeamName(highestBidder)} will buy {currentPlayer.name} for ${highestBid.toLocaleString()}. This cannot be undone automatically — use the undo button if it was a mistake.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={forceSold} className="bg-green-600 hover:bg-green-700 text-white">
                                    Confirm Sale
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="bg-red-600 hover:bg-red-700 text-white">Force Unsold</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark {currentPlayer.name} as unsold?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    The player will return to the pool and cannot be re-auctioned.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={forceUnsold} className="bg-red-600 hover:bg-red-700 text-white">
                                    Confirm Unsold
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="bg-white/5 backdrop-blur-md border-white/10">
                    <CardContent className="py-16 text-center">
                      <Gavel className="h-20 w-20 text-gray-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {isAuctionLive ? "Preparing next player..." : "Auction Room"}
                      </h2>
                      <p className="text-gray-400">
                        {isAuctionLive
                          ? "Get ready — the next player is coming up."
                          : "Press Start Auction to bring the first player to the block."}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent results */}
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

          {/* Sidebar */}
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
                  {teams.map((team) => {
                    const assets = getTeamAssetsSafe(team);
                    const isWinning = team._id === highestBidder;
                    const cantAfford = currentPlayer && team.purse < nextBid;
                    return (
                      <motion.button
                        key={team._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTeam(team._id)}
                        disabled={cantAfford}
                        className={`w-full text-left rounded-lg p-3 transition-colors ${
                          isWinning
                            ? "bg-green-600/30 border border-green-400"
                            : selectedTeam === team._id
                              ? "bg-blue-600/30 border border-blue-400"
                              : "bg-white/10 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {assets.logo && (
                              <img
                                src={assets.logo}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            )}
                            <span className="text-white font-medium truncate">
                              {team.name}
                              {isWinning && <span className="text-green-400 ml-1">•</span>}
                            </span>
                          </div>
                          <Badge
                            className={`${
                              team.purse < nextBid && currentPlayer ? "bg-gray-600" : "bg-green-600"
                            } shrink-0`}
                          >
                            ${team.purse.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          Players: {team.players?.length || 0}
                          {cantAfford && <span className="text-red-400 ml-2">can't bid</span>}
                        </div>
                      </motion.button>
                    );
                  })}
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
                            <span className="text-white text-sm">{bid.teamName || getTeamName(bid.teamId)}</span>
                            <Badge className="bg-blue-600">${bid.amount.toLocaleString()}</Badge>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {winningTeam && currentPlayer && (
              <Card className="bg-green-600/20 backdrop-blur-md border border-green-500/40">
                <CardContent className="py-4 text-center">
                  <p className="text-green-300 text-sm uppercase tracking-wide mb-1">Currently Winning</p>
                  <div className="flex items-center justify-center gap-3">
                    {getTeamAssetsSafe(winningTeam).logo && (
                      <img
                        src={getTeamAssetsSafe(winningTeam).logo}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="text-white font-bold text-lg">{winningTeam.name}</p>
                      <p className="text-green-300 text-sm">${highestBid.toLocaleString()}</p>
                    </div>
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
