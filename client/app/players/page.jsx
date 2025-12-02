"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trophy, Plus, Search, Filter } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export default function PlayersPage() {
  const [players, setPlayers] = useState([])
  const [filteredPlayers, setFilteredPlayers] = useState([])
  const [newPlayer, setNewPlayer] = useState({ name: "", position: "", rating: "", basePrice: "" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    filterPlayers()
  }, [players, searchTerm, positionFilter, statusFilter])


  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/players`)
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error("Error fetching players:", error)
    }
  }

  const createPlayer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPlayer.name,
          position: newPlayer.position,
          rating: Number.parseInt(newPlayer.rating),
          basePrice: Number.parseInt(newPlayer.basePrice),
        }),
      })

      if (response.ok) {
        setNewPlayer({ name: "", position: "", rating: "", basePrice: "" })
        setIsDialogOpen(false)
        fetchPlayers()
      }
    } catch (error) {
      console.error("Error creating player:", error)
    }
  }

  const filterPlayers = () => {
    let filtered = players

    if (searchTerm) {
      filtered = filtered.filter((player) => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (positionFilter) {
      filtered = filtered.filter((player) => player.position === positionFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((player) => (statusFilter === "sold" ? player.isSold : !player.isSold))
    }

    setFilteredPlayers(filtered)
  }

  const positions = [...new Set(players.map((p) => p.position))]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 pt-24">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Players</h1>
          <p className="text-xl text-gray-300 mb-6">Browse and manage player database</p>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New Player
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Create New Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Player Name"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Position (e.g., Forward, Midfielder)"
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  type="number"
                  placeholder="Rating (1-100)"
                  value={newPlayer.rating}
                  onChange={(e) => setNewPlayer({ ...newPlayer, rating: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="1"
                  max="100"
                />
                <Input
                  type="number"
                  placeholder="Base Price"
                  value={newPlayer.basePrice}
                  onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={createPlayer}
                  disabled={!newPlayer.name || !newPlayer.position || !newPlayer.rating || !newPlayer.basePrice}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Create Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
              />
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="bg-white/20 text-white border border-white/30 rounded-md p-3"
            >
              <option value="">All Positions</option>
              {positions.map((position) => (
                <option key={position} value={position} className="text-black">
                  {position}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/20 text-white border border-white/30 rounded-md p-3"
            >
              <option value="all" className="text-black">
                All Players
              </option>
              <option value="unsold" className="text-black">
                Available
              </option>
              <option value="sold" className="text-black">
                Sold
              </option>
            </select>

            <div className="flex items-center text-white">
              <Filter className="h-4 w-4 mr-2" />
              <span>{filteredPlayers.length} players</span>
            </div>
          </div>
        </motion.div>

        {/* Players Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredPlayers.map((player) => (
            <motion.div key={player._id} variants={itemVariants}>
              <Card
                className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 ${player.isSold ? "ring-2 ring-green-500" : ""
                  }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg flex items-center justify-between">
                    <span className="truncate">{player.name}</span>
                    {player.isSold && <Badge className="bg-green-600 text-xs">SOLD</Badge>}
                  </CardTitle>
                  <p className="text-gray-300 text-sm">{player.position}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Rating</span>
                      <Badge
                        className={`${player.rating >= 80 ? "bg-green-600" : player.rating >= 60 ? "bg-yellow-600" : "bg-red-600"
                          } text-white`}
                      >
                        {player.rating}
                      </Badge>
                    </div>

                    {/* Base Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Base Price</span>
                      <Badge className="bg-blue-600 text-white">${player.basePrice.toLocaleString()}</Badge>
                    </div>

                    {/* Sold Info */}
                    {player.isSold && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Sold Price</span>
                          <Badge className="bg-green-600 text-white">
                            ${player.soldPrice?.toLocaleString() || "N/A"}
                          </Badge>
                        </div>
                        <div className="bg-green-600/20 rounded-lg p-2">
                          <p className="text-green-300 text-xs text-center">Owned by Team</p>
                        </div>
                      </>
                    )}

                    {/* Status Indicator */}
                    <div className={`w-full h-2 rounded-full ${player.isSold ? "bg-green-500" : "bg-yellow-500"}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredPlayers.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Trophy className="h-24 w-24 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Players Found</h3>
            <p className="text-gray-300">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
