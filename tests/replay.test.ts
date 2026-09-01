import assert from "node:assert/strict";
import { test } from "node:test";
import { replayFeedback } from "../src/replay/feedback";
import { replayScheme, replayTargetError } from "../src/replay/target";
import type { ReplayAttempt } from "../src/types";

test("replay targets require a host and a valid TCP port", () => {
  assert.match(replayTargetError("", 443) ?? "", /连接目标/u);
  assert.match(replayTargetError("example.test", 0) ?? "", /端口/u);
  assert.match(replayTargetError("example.test", 65_536) ?? "", /端口/u);
  assert.match(replayTargetError("example.test", 443.5) ?? "", /端口/u);
  assert.equal(replayTargetError("example.test", 443), undefined);
});

test("replay attempts restore their recorded transport scheme", () => {
  assert.equal(replayScheme("http"), "http");
  assert.equal(replayScheme("https"), "https");
});

test("replay feedback keeps recorded failures distinct from completions", () => {
  const attempt = { status: "failed", error: "TLS handshake failed" } as ReplayAttempt;
  assert.deepEqual(replayFeedback({ attempt }), { kind: "error", message: "TLS handshake failed" });
  assert.deepEqual(replayFeedback({ capture_pending: true }), {
    kind: "success", message: "请求已返回，响应流量仍在入库",
  });
  assert.deepEqual(replayFeedback({ response_status: 204 }), { kind: "success", message: "重放完成：HTTP 204" });
});
