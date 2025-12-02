import express from "express";
import { getTeams, createTeam, getTeamById } from "../controllers/teamController.js";
const router = express.Router();

router.get("/", getTeams);
router.post("/", createTeam);
router.get("/:id", getTeamById);

export default router;
