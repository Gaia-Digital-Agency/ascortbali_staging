import { verifyJwt } from "../lib/jwt.js";
export async function requireAuth(req, res, next) {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token)
        return res.status(401).json({ error: "missing_token" });
    try {
        const payload = await verifyJwt(token);
        req.user = { id: payload.sub, role: payload.role, username: payload.username };
        return next();
    }
    catch {
        return res.status(401).json({ error: "invalid_token" });
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: "missing_token" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "forbidden" });
        return next();
    };
}
