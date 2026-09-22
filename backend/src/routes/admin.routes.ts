import { Router } from "express";
import { registrations } from "../controllers/admin.controller.js";

const router = Router();
router.get("/registrations", registrations);
export default router;
