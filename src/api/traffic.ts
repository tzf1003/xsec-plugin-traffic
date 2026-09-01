import type { PluginHost, ReplayResult, TrafficDetail, TrafficFilter, TrafficPage } from "../types";
import { loggedAction } from "../logging";
import { replayAttempts, replayResult, trafficDetail, trafficPage } from "./traffic-parse";

const PAGE_SIZE = 100;

export async function listTraffic(
  host: PluginHost,
  cursor: string | undefined,
  filter: TrafficFilter,
): Promise<TrafficPage> {
  const params = { limit: PAGE_SIZE, filter, ...(cursor ? { cursor } : {}) };
  return trafficPage(await host.request("xsec.traffic.list", params));
}

export async function getTraffic(host: PluginHost, flowId: string): Promise<TrafficDetail> {
  return trafficDetail(await host.request("xsec.traffic.get", { flowId }));
}

export async function getReplayAttempts(host: PluginHost, flowId: string) {
  return replayAttempts(await host.request("xsec.traffic.replay-attempts", { flowId }));
}

export async function replayTraffic(host: PluginHost, input: {
  sourceFlowId: string;
  rawRequest: string;
  scheme: "http" | "https";
  targetHost: string;
  targetPort: number;
  confirmSensitiveHostChange: boolean;
}): Promise<ReplayResult> {
  return loggedAction("traffic.replay", {
    scheme: input.scheme,
    targetPort: input.targetPort,
    sensitiveHostChangeConfirmed: input.confirmSensitiveHostChange,
  }, async () => replayResult(await host.request("xsec.traffic.replay", input)));
}

export async function openTrafficTool(
  host: PluginHost,
  options: {
    toolId: "request-detail" | "traffic-replay";
    flowId: string;
    title?: string;
  },
): Promise<void> {
  await loggedAction("traffic.tool.open", { toolId: options.toolId }, async () => {
    await host.request("xsec.workspace.tool.open", {
      toolId: options.toolId,
      entityId: options.flowId,
      ...(options.title ? { title: options.title } : {}),
    });
  });
}

export async function addTrafficReference(host: PluginHost, flowId: string): Promise<void> {
  await loggedAction("traffic.reference.add", {}, async () => {
    await host.request("xsec.traffic.reference.add", { flowId });
  });
}
