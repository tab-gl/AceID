"use strict";

const https = require("node:https");

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function parseUpstreamOrigin(value) {
  if (!value || !value.trim()) return { error: "api_upstream_not_configured" };

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return { error: "api_upstream_invalid" };
    }

    return { origin: url.origin };
  } catch {
    return { error: "api_upstream_invalid" };
  }
}

// Only the account and auth endpoints the frontend calls are
// forwarded; everything else under /api is refused before reaching the backend.
const ALLOWED_API_PREFIXES = [
  "/api/me",
  "/api/account",
  "/api/email-verification",
  "/api/username-availability",
  "/api/login",
];

// Reasonable verbs for the account API. Anything else is refused here instead
// of being smuggled to the backend.
const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

function isAllowedApiPath(pathname) {
  return ALLOWED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

// Percent-decoding view of a request path, used to close encoded traversal
// (/api/account/..%2f..%2fadmin) that a raw allowlist check would pass but a
// decoding upstream router would resolve to a different endpoint. The check
// must succeed on both the raw and the decoded form.
function decodedPathname(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\\") || decoded.includes("\0") || decoded.includes("?") || decoded.includes("#")) {
    return null;
  }
  try {
    return new URL(decoded, "https://vercel-internal.invalid").pathname;
  } catch {
    return null;
  }
}

// The public host is echoed to the backend in X-Forwarded-Host, which the
// issuer uses to build URLs. Never echo an unvalidated Host header: that is
// host-header injection into every redirect and email link the backend emits.
function resolvePublicHost(rawHost) {
  const allowed = String(process.env.ACEID_PUBLIC_HOSTS || "identity.ace-base.cc")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const fallback = allowed[0] || "identity.ace-base.cc";
  const host = String(rawHost || "").toLowerCase();
  const bare = host.replace(/:\d+$/, "");
  return allowed.includes(host) || allowed.includes(bare) ? host : fallback;
}

function sendError(res, statusCode, code, description) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({ error: code, error_description: description }));
}

function handler(req, res) {
  const parsedOrigin = parseUpstreamOrigin(process.env.ACEID_API_BASE_URL);
  if (parsedOrigin.error === "api_upstream_not_configured") {
    return sendError(
      res,
      503,
      parsedOrigin.error,
      "The backend API origin is not configured for this deployment."
    );
  }
  if (parsedOrigin.error) {
    return sendError(
      res,
      503,
      parsedOrigin.error,
      "ACEID_API_BASE_URL must be an HTTPS origin with no path, query, or credentials."
    );
  }

  let incoming;
  try {
    incoming = new URL(req.url || "/api", "https://vercel-internal.invalid");
  } catch {
    return sendError(res, 400, "invalid_request_path", "The request path is invalid.");
  }
  if (incoming.pathname !== "/api" && !incoming.pathname.startsWith("/api/")) {
    return sendError(res, 404, "not_found", "The API route was not found.");
  }

  const method = (req.method || "GET").toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    return sendError(res, 405, "method_not_allowed", "The request method is not supported.");
  }

  // The allowlist must pass for the raw path and for its percent-decoded,
  // dot-resolved form, so encoded traversal cannot widen the match.
  const decodedPath = decodedPathname(incoming.pathname);
  if (
    decodedPath === null ||
    !isAllowedApiPath(incoming.pathname) ||
    !isAllowedApiPath(decodedPath)
  ) {
    return sendError(res, 404, "not_found", "The API route was not found.");
  }

  const target = new URL(incoming.pathname + incoming.search, parsedOrigin.origin);
  const headers = {};
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (value == null || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) continue;
    if (name.toLowerCase() === "host") continue;
    headers[name] = value;
  }

  // The Deplexo edge routes by its own hostname and rejects a foreign Host with
  // 403, so Host must be the upstream host. The public host travels in
  // X-Forwarded-Host so issuer-origin checks and cookie scope still work.
  const publicHost = resolvePublicHost(req.headers?.host);
  headers.host = target.host;
  headers["x-forwarded-host"] = publicHost;
  headers["x-forwarded-proto"] = "https";
  headers["cache-control"] = req.headers?.["cache-control"] || "no-store";

  const upstream = https.request(
    target,
    { method, headers, timeout: 8000 },
    (upstreamResponse) => {
      res.statusCode = upstreamResponse.statusCode || 502;
      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value == null || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) continue;
        res.setHeader(name, value);
      }
      res.setHeader("cache-control", "no-store");
      upstreamResponse.pipe(res);
    }
  );

  upstream.on("timeout", () => upstream.destroy(new Error("upstream_timeout")));
  upstream.on("error", (error) => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    const code = error.message === "upstream_timeout" ? "api_upstream_timeout" : "api_upstream_unavailable";
    const status = code === "api_upstream_timeout" ? 504 : 502;
    sendError(res, status, code, "The backend API could not complete the request.");
  });

  req.pipe(upstream);
}

handler.parseUpstreamOrigin = parseUpstreamOrigin;
handler.decodedPathname = decodedPathname;
handler.resolvePublicHost = resolvePublicHost;
module.exports = handler;
