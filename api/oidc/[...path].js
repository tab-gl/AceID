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

const ALLOWED_EXACT_PATHS = new Set([
  "/auth",
  "/token",
  "/me",
  "/jwks",
  "/reg",
  "/device",
  "/health/live",
  "/health/ready",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/logout",
  "/privacy",
  "/terms",
  "/account/unfreeze",
]);

const ALLOWED_PATH_PREFIXES = [
  "/interaction/",
  "/session/",
  "/token/",
  "/request/",
  "/connect/",
  "/login/",
];

// Reasonable verbs for the OIDC provider endpoints. Anything else is refused
// here instead of being smuggled to the backend.
const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

// The public host is echoed to the backend in X-Forwarded-Host, which the
// provider trusts to build redirect URLs and email links. Never echo an
// unvalidated Host header: that is host-header injection into every
// authorization redirect and reset link the provider emits.
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

function parseUpstreamOrigin(value) {
  if (!value || !value.trim()) {
    return { error: "api_upstream_not_configured" };
  }

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

function isAllowedOIDCPath(path) {
  return (
    ALLOWED_EXACT_PATHS.has(path) ||
    ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

// Percent-decoding view of a mapped endpoint path, used to close encoded
// traversal (/login/..%2f..%2fadmin) that the raw allowlist would pass but a
// decoding upstream router would resolve to a different endpoint. The
// allowlist must succeed on both the raw and the decoded form.
function decodedOIDCPath(path) {
  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (decoded.includes("\\") || decoded.includes("\0") || decoded.includes("?") || decoded.includes("#")) {
    return null;
  }
  try {
    return new URL(decoded, "https://identity.invalid").pathname;
  } catch {
    return null;
  }
}

function mapOIDCPath(requestUrl) {
  let parsed;
  try {
    parsed = new URL(requestUrl || "/", "https://identity.invalid");
  } catch {
    return { error: "not_found" };
  }

  // Vercel can invoke a rewritten catch-all with either the destination
  // (/api/oidc/auth) or the stripped endpoint path (/auth). Normalize both
  // forms; do not reject a valid provider endpoint just because routing has
  // already removed the internal prefix.
  let path;
  if (parsed.pathname === "/api/oidc" || parsed.pathname.startsWith("/api/oidc/")) {
    path = parsed.pathname.slice("/api/oidc".length) || "/";
  } else {
    path = parsed.pathname || "/";
  }

  const decodedPath = decodedOIDCPath(path);
  if (
    decodedPath === null ||
    !isAllowedOIDCPath(path) ||
    !isAllowedOIDCPath(decodedPath) ||
    path.includes("\\") ||
    path.includes("\0")
  ) {
    return { error: "not_found" };
  }

  return { pathAndQuery: path + parsed.search };
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function wantsHtml(req) {
  const accept = String(req?.headers?.accept || "");
  return accept.includes("text/html") && !accept.includes("application/json");
}

// Browsers opening an account page should see a readable message, not raw JSON.
// API and OIDC clients keep receiving the JSON error body.
function sendError(res, statusCode, code, description, req) {
  res.statusCode = statusCode;
  res.setHeader("cache-control", "no-store");
  if (req && wantsHtml(req)) {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(
      "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
      "<title>Ace ID is unavailable</title>" +
      "<style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif;background:#fafaf8;color:#111}" +
      "main{max-width:440px}h1{font-size:22px;margin:0 0 12px}p{line-height:1.5;color:#444;margin:0 0 10px}small{color:#777;font-family:monospace}</style>" +
      "</head><body><main><h1>Ace ID is temporarily unavailable</h1>" +
      "<p>" + escapeText(description) + "</p>" +
      "<p>Please try again in a few minutes.</p>" +
      "<small>" + escapeText(code) + "</small></main></body></html>"
    );
    return;
  }
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: code, error_description: description }));
}

function handler(req, res) {
  const method = (req.method || "GET").toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    return sendError(
      res,
      405,
      "method_not_allowed",
      "The request method is not supported.",
      req,
    );
  }

  const mapped = mapOIDCPath(req.url);
  if (mapped.error) {
    return sendError(
      res,
      404,
      "not_found",
      "The requested OIDC endpoint does not exist.",
      req,
    );
  }

  const parsedOrigin = parseUpstreamOrigin(process.env.ACEID_API_BASE_URL);
  if (parsedOrigin.error === "api_upstream_not_configured") {
    return sendError(
      res,
      503,
      parsedOrigin.error,
      "The backend origin is not configured for this deployment.",
      req,
    );
  }
  if (parsedOrigin.error) {
    return sendError(
      res,
      503,
      parsedOrigin.error,
      "ACEID_API_BASE_URL must be a clean HTTPS origin without a path, query, or credentials.",
      req,
    );
  }

  const upstream = new URL(mapped.pathAndQuery, parsedOrigin.origin);
  const headers = {};
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (value === undefined || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      continue;
    }
    headers[name.toLowerCase()] = value;
  }

  // Preserve the public issuer host for OIDC redirects and cookie scope.
  // TLS still connects to the configured backend hostname.
  // The edge in front of the backend routes by its own hostname, so Host must be
  // the upstream host. The public issuer host travels in X-Forwarded-Host, which
  // the provider uses (proxy trust) to build URLs.
  const publicHost = resolvePublicHost(req.headers?.host);
  headers.host = upstream.host;
  headers["x-forwarded-host"] = publicHost;
  headers["x-forwarded-proto"] = "https";
  headers["cache-control"] = "no-store";

  const upstreamRequest = https.request(
    {
      protocol: "https:",
      hostname: upstream.hostname,
      port: upstream.port || 443,
      method,
      path: upstream.pathname + upstream.search,
      headers,
      timeout: 8000,
      servername: upstream.hostname,
    },
    (upstreamResponse) => {
      res.statusCode = upstreamResponse.statusCode || 502;
      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value === undefined || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
          continue;
        }
        res.setHeader(name, value);
      }
      res.setHeader("cache-control", "no-store");
      upstreamResponse.pipe(res);
    },
  );

  let timedOut = false;
  upstreamRequest.on("timeout", () => {
    timedOut = true;
    upstreamRequest.destroy(new Error("oidc_upstream_timeout"));
  });
  upstreamRequest.on("error", () => {
    if (res.headersSent) return res.destroy();
    if (timedOut) {
      return sendError(
        res,
        504,
        "oidc_upstream_timeout",
        "The OIDC backend took too long to respond.",
        req,
      );
    }
    sendError(
      res,
      502,
      "oidc_upstream_unavailable",
      "The OIDC backend could not be reached.",
      req,
    );
  });

  req.pipe(upstreamRequest);
}

module.exports = handler;
module.exports.handler = handler;
module.exports.mapOIDCPath = mapOIDCPath;
module.exports.parseUpstreamOrigin = parseUpstreamOrigin;
module.exports.resolvePublicHost = resolvePublicHost;
