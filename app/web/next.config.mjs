/** @type {import('next').NextConfig} */
// Keep base path config consistent across server + client.
// Prefer NEXT_PUBLIC_BASE_PATH because the app already uses it at runtime via `withBasePath`.
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH || "";
const trimmedBasePath = rawBasePath.trim().replace(/\/+$/g, "");
const basePath =
  trimmedBasePath && trimmedBasePath !== "/"
    ? trimmedBasePath.startsWith("/")
      ? trimmedBasePath
      : `/${trimmedBasePath}`
    : "";

const nextConfig = {
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
