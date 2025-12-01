import { NextResponse } from "next/server";

// Mock data - replace with actual database calls
const players = [
  {
    _id: "1",
    name: "Cristiano Ronaldo",
    position: "Forward",
    rating: 95,
    basePrice: 5000000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "2",
    name: "Lionel Messi",
    position: "Forward",
    rating: 96,
    basePrice: 5500000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "3",
    name: "Kevin De Bruyne",
    position: "Midfielder",
    rating: 92,
    basePrice: 4000000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "4",
    name: "Virgil van Dijk",
    position: "Defender",
    rating: 90,
    basePrice: 3500000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "5",
    name: "Alisson Becker",
    position: "Goalkeeper",
    rating: 89,
    basePrice: 2500000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "6",
    name: "Kylian Mbappe",
    position: "Forward",
    rating: 94,
    basePrice: 6000000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "7",
    name: "Erling Haaland",
    position: "Forward",
    rating: 93,
    basePrice: 5500000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "8",
    name: "Pedri",
    position: "Midfielder",
    rating: 88,
    basePrice: 3000000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "9",
    name: "Jude Bellingham",
    position: "Midfielder",
    rating: 87,
    basePrice: 2800000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
  {
    _id: "10",
    name: "Vinicius Jr",
    position: "Forward",
    rating: 91,
    basePrice: 4500000,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  },
];

export async function GET() {
  return NextResponse.json(players);
}

export async function POST(request) {
  const body = await request.json();
  const newPlayer = {
    _id: Date.now().toString(),
    name: body.name,
    position: body.position,
    rating: body.rating,
    basePrice: body.basePrice,
    isSold: false,
    isUnsold: false,
    soldTo: null,
    soldPrice: null,
  };
  players.push(newPlayer);
  return NextResponse.json(newPlayer, { status: 201 });
}

export async function PUT(request) {
  const body = await request.json();
  const { playerId, isSold, isUnsold, soldTo, soldPrice } = body;

  const playerIndex = players.findIndex((p) => p._id === playerId);
  if (playerIndex !== -1) {
    players[playerIndex] = {
      ...players[playerIndex],
      isSold: isSold || false,
      isAlreadyAuctioned: true,
      isUnsold: isUnsold || false,
      soldTo: soldTo || null,
      soldPrice: soldPrice || null,
    };
    return NextResponse.json(players[playerIndex]);
  }

  return NextResponse.json({ error: "Player not found" }, { status: 404 });
}
