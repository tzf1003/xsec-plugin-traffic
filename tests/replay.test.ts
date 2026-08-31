import assert from "node:assert/strict";
import { test } from "node:test";
import { replayTargetError } from "../src/replay/target";

test("replay targets require a host and a valid TCP port", () => {
  assert.match(replayTargetError("", 443) ?? "", /连接目标/u);
  assert.match(replayTargetError("example.test", 0) ?? "", /端口/u);
  assert.match(replayTargetError("example.test", 65_536) ?? "", /端口/u);
  assert.match(replayTargetError("example.test", 443.5) ?? "", /端口/u);
  assert.equal(replayTargetError("example.test", 443), undefined);
});
