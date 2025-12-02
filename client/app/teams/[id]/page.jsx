"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, DollarSign, Trophy, Star } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { getTeamAssets } from "@/lib/team-utils"

export default function TeamDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [team, setTeam] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchTeamDetails()
        }
    }, [id])

    const fetchTeamDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${id}`)
            if (response.ok) {
                const data = await response.json()
                setTeam(data)
            } else {
                console.error("Failed to fetch team details")
            }
        } catch (error) {
            console.error("Error fetching team details:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                Loading...
            </div>
        )
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl font-bold">Team not found</h1>
                <Button onClick={() => router.push("/teams")} variant="outline">
                    Back to Teams
                </Button>
            </div>
        )
    }

    const assets = getTeamAssets(team.name)
    const totalSpent = team.players?.reduce((sum, p) => sum + (p.soldPrice || 0), 0) || 0
    const totalRating = team.players?.reduce((sum, p) => sum + (p.rating || 0), 0) || 0
    const remainingBudget = team.purse - totalSpent

    return (
        <div
            className="min-h-screen p-4 pt-24 transition-all duration-500"
            style={{ background: assets.customGradient }}
        >
            <div className="container mx-auto">
                <Button
                    onClick={() => router.push("/teams")}
                    variant="ghost"
                    className="text-white mb-6 hover:bg-black/20"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Teams
                </Button>

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-xl"
                >
                    <div className="w-40 h-40 rounded-full bg-white p-2 shadow-2xl shrink-0">
                        <img
                            src={assets.logo}
                            alt={team.name}
                            className="w-full h-full object-contain rounded-full"
                        />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-md">{team.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <Badge className="bg-black/40 text-white text-lg px-4 py-2 backdrop-blur-md border border-white/20">
                                <Users className="h-5 w-5 mr-2" />
                                {team.players?.length || 0} Players
                            </Badge>
                            <Badge className="bg-green-600/80 text-white text-lg px-4 py-2 backdrop-blur-md border border-white/20">
                                <DollarSign className="h-5 w-5 mr-2" />
                                ${remainingBudget.toLocaleString()} Left
                            </Badge>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-gray-200">Total Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">${team.purse.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-gray-200">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-red-300">${totalSpent.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-gray-200">Total Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-yellow-400 flex items-center gap-2">
                                {totalRating}
                                <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Squad List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-md">
                        <Trophy className="h-8 w-8 text-yellow-400" />
                        Current Squad
                    </h2>

                    {team.players && team.players.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {team.players.map((player) => (
                                <Card key={player._id} className="bg-black/40 backdrop-blur-xl border-white/10 hover:bg-black/50 transition-all duration-300 group shadow-lg">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">{player.name}</h3>
                                            <p className="text-gray-300">{player.position}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-400">${player.soldPrice?.toLocaleString()}</div>
                                            <Badge variant="outline" className="text-yellow-400 border-yellow-400 mt-1">
                                                {player.rating} Rating
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-black/20 rounded-xl border border-white/10 backdrop-blur-md">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white mb-2">No Players Yet</h3>
                            <p className="text-gray-300">This team hasn't bought any players in the auction yet.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
