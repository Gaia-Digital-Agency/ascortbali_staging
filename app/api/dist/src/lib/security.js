import crypto from "crypto";
import { env } from "./env.js";
export function hmacIp(ip) {
    return crypto.createHmac("sha256", env.ANALYTICS_HMAC_SECRET).update(ip).digest("hex");
}
export function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}
