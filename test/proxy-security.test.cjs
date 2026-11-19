"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const api = require("../api/[...path].js");
const oidc = require("../api/oidc/[...path].js");

function fakeRes() {
  const headers = {};
  return {
    statusCode: 0,
    headers,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(body) { this.body = body; },
    destroy() { this.destroyed = true; },
  };
}

function withEnv(name, value, fn) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try { fn(); } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

// --- encoded path traversal must not widen the allowlist -----------------

test("account proxy rejects encoded traversal that decodes outside the allowlist", () => {
  withEnv("ACEID_API_BASE_URL", "https://api.example.com", () => {
    for (const url of [
      "/api/account/..%2f..%2fadmin",
      "/api/account/%2e%2e/%2e%2e/admin",
      "/api/login/..%2f..%2f..%2fadmin",
      "/api/email-verification/%2e%2e%2f%2e%2e%2fadmin",
      "/api/account%2f..%2f..%2fadmin",
    ]) {
      const res = fakeRes();
      api({ method: "GET", url, headers: { host: "identity.ace-base.cc" } }, res);
      assert.equal(res.statusCode, 404, url);
      assert.equal(JSON.parse(res.body).error, "not_found", url);
    }
  });
});

test("account proxy still allows normal subpaths of approved endpoints", () => {
  const https = require("node:https");
  const original = https.request;
  https.request = () => ({ on() { return this; }, destroy() {}, end() {} });
  try {
    withEnv("ACEID_API_BASE_URL", "https://api.example.com", () => {
      // These are forwarded to the stubbed backend, so only assert that the
      // proxy's own guard does not 404/405 them.
      for (const url of ["/api/account", "/api/account/sessions", "/api/login/mfa"]) {
        const res = fakeRes();
        api({ method: "GET", url, headers: { host: "identity.ace-base.cc" }, pipe() {} }, res);
        assert.notEqual(res.statusCode, 404, url);
        assert.notEqual(res.statusCode, 405, url);
      }
    });
  } finally {
    https.request = original;
  }
});

test("oidc proxy rejects encoded traversal that decodes outside the allowlist", () => {
  for (const url of [
    "/login/..%2f..%2fadmin",
    "/interaction/..%2f..%2fadmin",
    "/token/%2e%2e/%2e%2e/admin",
    "/api/oidc/login/..%2f..%2fadmin",
    "/login/..%5c..%5cadmin",
  ]) {
    const mapped = oidc.mapOIDCPath(url);
    assert.deepEqual(mapped, { error: "not_found" }, url);
  }
});

test("oidc proxy still allows legitimate provider paths", () => {
  for (const url of ["/auth", "/me", "/login", "/login/mfa", "/interaction/abc123", "/api/oidc/token"]) {
    const mapped = oidc.mapOIDCPath(url);
    assert.ok(mapped.pathAndQuery, url);
  }
});

// --- methods -------------------------------------------------------------

test("proxies refuse unsupported HTTP methods", () => {
  withEnv("ACEID_API_BASE_URL", "https://api.example.com", () => {
    for (const method of ["TRACE", "CONNECT", "PROPFIND"]) {
      const res = fakeRes();
      api({ method, url: "/api/account", headers: { host: "identity.ace-base.cc" } }, res);
      assert.equal(res.statusCode, 405, method);
      assert.equal(JSON.parse(res.body).error, "method_not_allowed", method);
    }
    const oidcRes = fakeRes();
    oidc({ method: "TRACE", url: "/login", headers: { accept: "application/json" } }, oidcRes);
    assert.equal(oidcRes.statusCode, 405);
    assert.equal(JSON.parse(oidcRes.body).error, "method_not_allowed");
  });
});

// --- Host header injection into X-Forwarded-Host --------------------------

test("public host is only echoed when it is on the allowlist", () => {
  withEnv("ACEID_PUBLIC_HOSTS", undefined, () => {
    assert.equal(api.resolvePublicHost("identity.ace-base.cc"), "identity.ace-base.cc");
    assert.equal(api.resolvePublicHost("identity.ace-base.cc:443"), "identity.ace-base.cc:443");
    assert.equal(api.resolvePublicHost("evil.com"), "identity.ace-base.cc");
    assert.equal(api.resolvePublicHost(undefined), "identity.ace-base.cc");
    assert.equal(oidc.resolvePublicHost("evil.com"), "identity.ace-base.cc");
  });
});

test("ACEID_PUBLIC_HOSTS configures additional legitimate hosts", () => {
  withEnv("ACEID_PUBLIC_HOSTS", "identity.ace-base.cc, account.ace-base.cc", () => {
    assert.equal(api.resolvePublicHost("account.ace-base.cc"), "account.ace-base.cc");
    assert.equal(api.resolvePublicHost("evil.com"), "identity.ace-base.cc");
    assert.equal(oidc.resolvePublicHost("Account.Ace-Base.cc"), "account.ace-base.cc");
  });
});

// --- decoded-path helper sanity ------------------------------------------

test("decoded path view rejects broken encodings and delimiters", () => {
  assert.equal(api.decodedPathname("/api/account/%zz"), null);
  assert.equal(api.decodedPathname("/api/account/a%3fb"), null);
  assert.equal(api.decodedPathname("/api/account/a%23b"), null);
  assert.equal(api.decodedPathname("/api/account/a%5cb"), null);
  // Non-ASCII subpaths survive the view (URL re-encodes, prefix stays intact).
  assert.equal(api.decodedPathname("/api/account/a%2Fb"), "/api/account/a/b");
  assert.ok(api.decodedPathname("/api/account/%E5%90%8D").startsWith("/api/account/"));
});
