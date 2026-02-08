import { RateLimiterMemory } from "rate-limiter-flexible";
const limiter = new RateLimiterMemory({
    points: 20, // 20 requests
    duration: 60, // per 60 seconds
});
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
