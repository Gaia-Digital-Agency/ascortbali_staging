// Import necessary modules for the server.
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pinoHttp } from "pino-http";
import { createRouter } from "./router.js";

// Initialize the Express application and apply middleware.
const app = express();

// Ensure req.ip reflects the real client IP when behind NGINX (via X-Forwarded-For).
// Default: trust the first proxy hop.
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv === undefined) {
  app.set("trust proxy", 1);
} else if (trustProxyEnv === "true") {
  app.set("trust proxy", true);
} else if (trustProxyEnv === "false") {
  app.set("trust proxy", false);
} else {
  const n = Number(trustProxyEnv);
  app.set("trust proxy", Number.isFinite(n) ? n : 1);
}

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(pinoHttp());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"], credentials: true }));

// Health check endpoint to verify the server is running.
app.get("/health", (_req, res) => res.json({ ok: true }));

// Register the main application router.
app.use(createRouter());

// Start the server on the configured port and host.
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";
app.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
});
