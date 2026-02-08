import { z } from "zod";
const EnvSchema = z.object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(4000),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
    JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(2592000),
    JWT_PRIVATE_KEY_PEM: z.string(),
    JWT_PUBLIC_KEY_PEM: z.string(),
    ANALYTICS_HMAC_SECRET: z.string().min(16),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
});
export const env = EnvSchema.parse(process.env);
