"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, Users, DollarSign, Play } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    soldPlayers: 0,
    totalValue: 0,
  })

  useEffect(() => {
    // Fetch initial stats
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([fetch("/api/teams"), fetch("/api/players")])

      const teams = await teamsRes.json()
      const players = await playersRes.json()

      const soldPlayers = players.filter((p) => p.isSold)
      const totalValue = soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0)

      setStats({
        totalTeams: teams.length,
        totalPlayers: players.length,
        soldPlayers: soldPlayers.length,
        totalValue,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
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
    <div className="min-h-screen relative bg-gray-900">
      {/* Hero Section */}
      <div className="relative w-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block"
        >
          <source src="/auction video homepage.mp4" type="video/mp4" />
        </video>

        {/* Overlay Content */}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
              Football Auction
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 drop-shadow-md">Live bidding for the ultimate football experience</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 animate-bounce hidden md:block"
          >
            <p className="text-white text-sm">Scroll Down</p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-gray-900 py-20 px-4">
        <div className="container mx-auto">
          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-green-600/20 backdrop-blur-md border-green-500/30 text-white hover:bg-green-600/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeams}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-blue-600/20 backdrop-blur-md border-blue-500/30 text-white hover:bg-blue-600/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                  <Trophy className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-purple-600/20 backdrop-blur-md border-purple-500/30 text-white hover:bg-purple-600/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sold Players</CardTitle>
                  <Play className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.soldPlayers}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-orange-600/20 backdrop-blur-md border-orange-500/30 text-white hover:bg-orange-600/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <Link href="/auction">
              <Card className="cursor-pointer hover:scale-105 transition-transform duration-300 bg-red-600/20 backdrop-blur-md border-red-500/30 text-white hover:bg-red-600/30 h-full">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <Play className="h-16 w-16 mb-6 text-red-400" />
                  <h3 className="text-3xl font-bold mb-4">Live Auction</h3>
                  <p className="text-red-100 text-lg">Join the live bidding action now</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/teams">
              <Card className="cursor-pointer hover:scale-105 transition-transform duration-300 bg-teal-600/20 backdrop-blur-md border-teal-500/30 text-white hover:bg-teal-600/30 h-full">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <Users className="h-16 w-16 mb-6 text-teal-400" />
                  <h3 className="text-3xl font-bold mb-4">Teams</h3>
                  <p className="text-teal-100 text-lg">View and manage teams</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/players">
              <Card className="cursor-pointer hover:scale-105 transition-transform duration-300 bg-indigo-600/20 backdrop-blur-md border-indigo-500/30 text-white hover:bg-indigo-600/30 h-full">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <Trophy className="h-16 w-16 mb-6 text-indigo-400" />
                  <h3 className="text-3xl font-bold mb-4">Players</h3>
                  <p className="text-indigo-100 text-lg">Browse player database</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
