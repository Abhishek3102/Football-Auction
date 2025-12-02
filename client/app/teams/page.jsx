"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, DollarSign, Trophy, Plus } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { getTeamAssets } from "@/lib/team-utils"

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [newTeam, setNewTeam] = useState({ name: "", purse: "" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`)
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const createTeam = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTeam.name,
          purse: Number.parseInt(newTeam.purse),
        }),
      })

      if (response.ok) {
        setNewTeam({ name: "", purse: "" })
        setIsDialogOpen(false)
        fetchTeams()
      }
    } catch (error) {
      console.error("Error creating team:", error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-blue-900 to-indigo-900 p-4 pt-24">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Teams</h1>
          <p className="text-xl text-gray-300 mb-6">Manage your auction teams</p>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New Team
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Team Name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  type="number"
                  placeholder="Budget (Purse)"
                  value={newTeam.purse}
                  onChange={(e) => setNewTeam({ ...newTeam, purse: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={createTeam}
                  disabled={!newTeam.name || !newTeam.purse}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Teams Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {teams.map((team) => {
            const assets = getTeamAssets(team.name);
            return (
              <motion.div
                key={team._id}
                variants={itemVariants}
                onClick={() => router.push(`/teams/${team._id}`)}
                className="cursor-pointer"
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex items-center justify-center p-1">
                      <img
                        src={assets.logo}
                        alt={team.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <CardTitle className="text-white text-2xl">
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Budget */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Budget
                        </span>
                        <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                          ${team.purse.toLocaleString()}
                        </Badge>
                      </div>

                      {/* Players Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Players
                        </span>
                        <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{team.players?.length || 0}</Badge>
                      </div>

                      {/* Team Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <div className="text-white font-bold">
                            ${(team.players?.reduce((sum, p) => sum + (p.soldPrice || 0), 0) || 0).toLocaleString()}
                          </div>
                          <div className="text-gray-300 text-xs">Spent</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <div className="text-white font-bold">
                            {team.players?.reduce((sum, p) => sum + (p.rating || 0), 0) || 0}
                          </div>
                          <div className="text-gray-300 text-xs">Total Rating</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {teams.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Users className="h-24 w-24 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Teams Yet</h3>
            <p className="text-gray-300">Create your first team to get started!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
