import { RateLimiterMemory } from "rate-limiter-flexible";
// In-memory rate limiter configuration.
const limiter = new RateLimiterMemory({
    points: 20, // 20 requests
    duration: 60, // per 60 seconds
});
// Middleware to apply rate limiting to a route.
export async function rateLimit(req, res, next) {
    const key = req.ip ?? "unknown";
    try {
        await limiter.consume(key);
        next();
    }
    catch {
        res.status(429).json({ error: "rate_limited" });
    }
}
