// This middleware rewrites requests for Next.js public assets to a GCS-backed route.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Rewrite Next `public/` assets to a GCS-backed route so the VM doesn't need
// repo-tracked static files present on disk in production.
//
// Requires uploading those assets to GCS under `${GCS_STATIC_PREFIX}/...`
// (default prefix: `baligirls/static`).
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const basePath = url.basePath || "";
  const pathname = url.pathname || "/";
  const configuredBasePath =
    (process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH || "").trim().replace(/\/+$/g, "");
  const mountPrefix =
    basePath ||
    configuredBasePath ||
    (pathname === "/baligirls" || pathname.startsWith("/baligirls/") ? "/baligirls" : "");

  // Strip basePath (or /baligirls mount prefix) for matching.
  const logical = mountPrefix && pathname.startsWith(mountPrefix) ? pathname.slice(mountPrefix.length) || "/" : pathname;

  const rewriteToStatic = (rel: string) => {
    url.pathname = `${mountPrefix}/api/static/${rel}`.replace(/\/{2,}/g, "/");
    return NextResponse.rewrite(url);
  };

  // Define rewrite rules for specific asset paths.
  if (logical === "/baligirls_logo.png") return rewriteToStatic("logo/logo.png");
  if (logical.startsWith("/placeholders/")) return rewriteToStatic(logical.slice("/".length));
  if (logical.startsWith("/logo/")) return rewriteToStatic(logical.slice("/".length));
  if (logical.startsWith("/ads/")) return rewriteToStatic(logical.slice("/".length));

  return NextResponse.next();
}

// Configure the matcher to run the middleware on all paths.
export const config = {
  matcher: ["/:path*"],
};
