import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";
import { env } from "./env.js";
const alg = "EdDSA"; // supports Ed25519 keys; you can swap to ES256 with proper keys.
async function getPrivateKey() {
    return importPKCS8(env.JWT_PRIVATE_KEY_PEM, alg);
}
async function getPublicKey() {
    return importSPKI(env.JWT_PUBLIC_KEY_PEM, alg);
}
export async function signAccessToken(payload) {
    const key = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setIssuedAt(now)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setExpirationTime(now + env.JWT_ACCESS_TTL_SECONDS)
        .sign(key);
}
export async function signRefreshToken(payload) {
    const key = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setIssuedAt(now)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setExpirationTime(now + env.JWT_REFRESH_TTL_SECONDS)
        .sign(key);
}
export async function verifyJwt(token) {
    const key = await getPublicKey();
    const res = await jwtVerify(token, key, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
    });
    return res.payload;
}
