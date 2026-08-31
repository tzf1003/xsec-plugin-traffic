import assert from "node:assert/strict";
import { test } from "node:test";
import { ensureHost, prettyBody, renderSection } from "../src/proxy";

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
