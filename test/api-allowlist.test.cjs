"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const proxy = require("../api/[...path].js");

function fakeRes() {
  const headers = {};
  return {
    statusCode: 0,
    headers,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(body) { this.body = body; },
  };
}

test("account API proxy refuses backend paths outside the frontend allowlist", () => {
  const previous = process.env.ACEID_API_BASE_URL;
  process.env.ACEID_API_BASE_URL = "https://api.example.com";
  try {
    for (const url of ["/api/admin/users", "/api/accountant", "/api/mexico", "/api/oidc/token"]) {
      const res = fakeRes();
      proxy({ method: "GET", url, headers: { host: "identity.ace-base.cc" } }, res);
      assert.equal(res.statusCode, 404, url);
      assert.equal(JSON.parse(res.body).error, "not_found", url);
    }
  } finally {
    if (previous === undefined) delete process.env.ACEID_API_BASE_URL;
    else process.env.ACEID_API_BASE_URL = previous;
  }
});

test("account API proxy forwards the /api/me contract paths", () => {
  const previous = process.env.ACEID_API_BASE_URL;
  delete process.env.ACEID_API_BASE_URL;
  try {
    for (const url of ["/api/me", "/api/me/devices", "/api/me/logs", "/api/me/connected-apps"]) {
      const res = fakeRes();
      proxy({ method: "GET", url, headers: { host: "identity.ace-base.cc" } }, res);
      assert.equal(res.statusCode, 503, url);
    }
  } finally {
    if (previous !== undefined) process.env.ACEID_API_BASE_URL = previous;
  }
});
