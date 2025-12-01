import { NextResponse } from "next/server";

// Mock data - replace with actual database calls
const teams = [
  {
    _id: "1",
    name: "Manchester United",
    purse: 50000000,
    players: [],
  },
  {
    _id: "2",
    name: "Chelsea FC",
    purse: 45000000,
    players: [],
  },
  {
    _id: "3",
    name: "Arsenal FC",
    purse: 40000000,
    players: [],
  },
  {
    _id: "4",
    name: "Liverpool FC",
    purse: 48000000,
    players: [],
  },
];

export async function GET() {
  return NextResponse.json(teams);
}

export async function POST(request) {
  const body = await request.json();
  const newTeam = {
    _id: Date.now().toString(),
    name: body.name,
    purse: body.purse,
    players: [],
  };
  teams.push(newTeam);
  return NextResponse.json(newTeam, { status: 201 });
}

export async function PUT(request) {
  const body = await request.json();
  const { teamId, playerId, playerName, soldPrice } = body;

  const teamIndex = teams.findIndex((t) => t._id === teamId);
  if (teamIndex !== -1) {
    // Check if player already exists in team to prevent duplicates
    const playerExists = teams[teamIndex].players.some(
      (p) => p._id === playerId
    );

    if (!playerExists) {
      // Add player to team
      console.log(
        `Adding player ${playerName} to team ${teams[teamIndex].name}`
      );

      teams[teamIndex].players.push({
        _id: playerId,
        name: playerName,
        soldPrice: soldPrice,
      });

      // Deduct money from purse
      teams[teamIndex].purse -= soldPrice;
    }

    return NextResponse.json(teams[teamIndex]);
  }

  return NextResponse.json({ error: "Team not found" }, { status: 404 });
}
