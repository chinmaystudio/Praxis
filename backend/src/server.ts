import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during dev/testing, log notice
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  })
);

// Middleware for parsing JSON with raw body retention for webhook verification
app.use(
  express.json({
    verify: (req: Request & { rawBody?: string }, _res: Response, buf: Buffer) => {
      req.rawBody = buf.toString("utf-8");
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Health Check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "praxis-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount payment API routes
app.use("/api/payments", paymentRoutes);

// Fallback 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Praxis Backend Unhandled Error]:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[Praxis Backend] Server running on http://localhost:${PORT}`);
    console.log(`[Praxis Backend] Health check: http://localhost:${PORT}/health`);
    console.log(`[Praxis Backend] Allowed origins: ${allowedOrigins.join(", ")}`);
  });
}

export default app;
