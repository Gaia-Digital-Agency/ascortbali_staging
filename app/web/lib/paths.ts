export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/g, "");

export function withBasePath(p: string) {
  if (!APP_BASE_PATH) return p;
  if (!p) return APP_BASE_PATH;
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${APP_BASE_PATH}${path}`;
}

