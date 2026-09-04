import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import { setupAuctionSocket } from "./sockets/auctionSocket.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const io = new (await import("socket.io")).Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow non-browser tools (no origin) and configured origins
      if (!origin || allowedOrigins.includes(origin) || process.env.CORS_ALLOW_ALL === "true") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.CORS_ALLOW_ALL === "true") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());

app.use("/api/players", playerRoutes);
app.use("/api/teams", teamRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

setupAuctionSocket(io);

// 404 + error handlers so clients never hang on unknown routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
