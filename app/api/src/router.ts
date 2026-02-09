// This module centralizes and exports the main API router.
import { Router } from "express";
import { authRouter } from "./routes/auth.js";
import { servicesRouter } from "./routes/services.js";
import { meRouter } from "./routes/me.js";
import { ordersRouter } from "./routes/orders.js";
import { analyticsRouter } from "./routes/analytics.js";
import { adsRouter } from "./routes/ads.js";
import { adminRouter } from "./routes/admin.js";
import { creatorsRouter } from "./routes/creators.js";

// Creates and configures the main API router.
export function createRouter() {
  const r = Router();
  // Mount individual routers for different API sections.
  r.use("/auth", authRouter);
  r.use("/services", servicesRouter);
  r.use("/me", meRouter);
  r.use("/orders", ordersRouter);
  r.use("/analytics", analyticsRouter);
  r.use("/ads", adsRouter);
  r.use("/creators", creatorsRouter);
  r.use("/admin", adminRouter);
  return r;
}
