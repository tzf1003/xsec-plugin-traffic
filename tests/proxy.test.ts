import assert from "node:assert/strict";
import { test } from "node:test";
import { ensureHost, prettyBody, renderSection, requiresSensitiveHostConfirmation } from "../src/proxy";

test("raw request adds an authority without replacing an existing Host", () => {
  const raw = "GET /login HTTP/1.1\r\nAccept: */*\r\n\r\n";
  assert.match(ensureHost(raw, { host: "2001:db8::1", port: 8443, scheme: "https" }), /Host: \[2001:db8::1\]:8443/);
  const existing = "GET / HTTP/1.1\r\nHost: example.test\r\n\r\n";
  assert.equal(ensureHost(existing, { host: "other.test", port: 443, scheme: "https" }), existing);
});

test("message rendering preserves start line, headers, body and JSON pretty view", () => {
  assert.equal(renderSection({ line: "HTTP/1.1 200 OK", headers: [["Content-Type", "application/json"]], body: "{\"ok\":true}" }), "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"ok\":true}");
  assert.equal(prettyBody("{\"ok\":true}"), "{\n  \"ok\": true\n}");
});

test("replay confirmation is derived from the target and sensitive request headers", () => {
  const raw = "GET / HTTP/1.1\r\nHost: old.test\r\nCookie: session=1\r\n\r\n";
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "new.test", rawRequest: raw }), true);
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "OLD.TEST", rawRequest: raw }), false);
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "new.test", rawRequest: raw.replace("Cookie", "X-Test") }), false);
  const editedHost = raw.replace("old.test", "other.test");
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "old.test", rawRequest: editedHost }), true);
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "old.test", rawRequest: raw }), false);
  const ipv6 = "GET / HTTP/1.1\r\nHost: [2001:db8::1]\r\nCookie: session=1\r\n\r\n";
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "2001:db8::1", targetHost: "2001:db8::1", rawRequest: ipv6 }), false);
  const authority = "GET / HTTP/1.1\r\nHost: OTHER.test:8443\r\nAuthorization: Bearer 1\r\n\r\n";
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "old.test", rawRequest: authority }), true);
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "other.test", targetHost: "other.test", rawRequest: authority }), false);
  const absoluteForeign = "GET https://other.test/path HTTP/1.1\r\nHost: old.test\r\nCookie: session=1\r\n\r\n";
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "old.test", rawRequest: absoluteForeign }), true);
  const absoluteSame = "GET https://old.test/path HTTP/1.1\r\nHost: old.test\r\nCookie: session=1\r\n\r\n";
  assert.equal(requiresSensitiveHostConfirmation({ sourceHost: "old.test", targetHost: "old.test", rawRequest: absoluteSame }), false);
});
