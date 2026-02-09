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

  // Strip basePath for matching, keep it for rewrite destinations.
  const logical = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;

  const rewriteToStatic = (rel: string) => {
    url.pathname = `${basePath}/api/static/${rel}`.replace(/\/{2,}/g, "/");
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

