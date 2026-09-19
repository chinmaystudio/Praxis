import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getRegistration,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", handleWebhook);
router.get("/registration/:id", getRegistration);

export default router;
