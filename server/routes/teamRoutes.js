import express from "express";
import {
  getTeams,
  createTeam,
  getTeamById,
  deleteTeam,
} from "../controllers/teamController.js";
import { getStats, undoLastSale } from "../controllers/auctionController.js";
const router = express.Router();

router.get("/", getTeams);
router.post("/", createTeam);
router.get("/stats/summary", getStats);
router.post("/undo-last-sale", undoLastSale);
router.get("/:id", getTeamById);
router.delete("/:id", deleteTeam);

export default router;
