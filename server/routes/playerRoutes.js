import express from "express";
import {
  getUnsoldPlayers,
  createPlayer,
} from "../controllers/playerController.js";
const router = express.Router();

router.get("/", getUnsoldPlayers);
router.post("/", createPlayer);

export default router;
