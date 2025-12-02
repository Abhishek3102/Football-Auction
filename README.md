# Football Auction System

A real-time football player auction system built with the MERN stack (MongoDB, Express, React/Next.js, Node.js) and Socket.io. This application allows teams to bid on players in real-time, manage their squads, and view detailed team statistics.

## 🚀 Features

- **Real-time Auction**: Live bidding system using Socket.io with real-time updates for all connected clients.
- **Team Management**: Create and manage teams with specific budgets (purses).
- **Player Database**: Comprehensive list of players with ratings, positions, and base prices.
- **Dynamic Team Pages**: Individual team pages with custom themes (gradients and logos) matching real-world clubs.
- **Interactive UI**: Glassmorphism design, animations using Framer Motion, and responsive layout.
- **Stats & Analytics**: Real-time tracking of budget spent, remaining purse, and squad composition.

## 🛠️ Tech Stack

### Client (`/client`)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Framer Motion (animations)
- **UI Components**: Shadcn UI (Radix UI based)
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`)
- **Real-time**: `socket.io-client`

### Server (`/server`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: `socket.io`
- **CORS**: Enabled for cross-origin requests

## 📂 Project Structure

### Client Structure (`/client`)
```
client/
├── app/                    # Next.js App Router
│   ├── auction/            # Live auction page
│   ├── players/            # Player listing and filtering
│   ├── teams/              # Team management and listing
│   │   ├── [id]/           # Dynamic team details page
│   │   └── page.jsx        # Teams listing page
│   ├── layout.jsx          # Root layout
│   └── page.jsx            # Landing/Home page
├── components/             # Reusable UI components
│   └── ui/                 # Shadcn UI components (Button, Card, etc.)
├── lib/                    # Utilities and configuration
│   ├── config.js           # API base URL configuration
│   ├── team-utils.js       # Team assets (logos, gradients) mapping
│   └── utils.js            # Helper functions
├── public/                 # Static assets
│   └── logos/              # Team logos
└── ...
```

### Server Structure (`/server`)
```
server/
├── config/                 # Configuration files (DB connection)
├── controllers/            # Request handlers
│   ├── playerController.js # Player CRUD operations
│   └── teamController.js   # Team CRUD operations
├── models/                 # Mongoose schemas
│   ├── Player.js           # Player schema
│   └── Team.js             # Team schema
├── routes/                 # API routes
│   ├── playerRoutes.js     # /api/players routes
│   └── teamRoutes.js       # /api/teams routes
├── server.js               # Entry point (Express + Socket.io setup)
└── ...
```

## 🚦 Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed and running (or a MongoDB Atlas connection string)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd "Football Auction"
    ```

2.  **Setup Server**
    ```bash
    cd server
    npm install
    # Create a .env file if needed with PORT and MONGODB_URI
    npm run dev
    ```
    The server will start on `http://localhost:5000`.

3.  **Setup Client**
    ```bash
    cd ../client
    npm install
    npm run dev
    ```
    The client will start on `http://localhost:3000`.

## 🔧 Configuration

- **API URL**: The client connects to the backend via `client/lib/config.js`.
    - For local development: `export const API_BASE_URL = "http://localhost:5000";`
    - For production: Update this URL to your deployed backend endpoint.

## 🎨 Customization

- **Team Assets**: Update `client/lib/team-utils.js` to add new teams, change logos, or modify color gradients.
- **Logos**: Place new team logos in `client/public/logos/`.

## 🤝 Contributing

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
