import express from "express";
import {
  getAllPlayers,
  getUnsoldPlayers,
  createPlayer,
  deletePlayer,
} from "../controllers/playerController.js";
const router = express.Router();

router.get("/", getAllPlayers);
router.get("/unsold", getUnsoldPlayers);
router.post("/", createPlayer);
router.delete("/:id", deletePlayer);

export default router;
