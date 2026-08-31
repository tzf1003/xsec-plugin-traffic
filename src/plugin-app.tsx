import type { PluginContext, PluginHost } from "./types";
import { EmptyState, Notice } from "./ui/primitives";
import { DetailPage } from "./traffic/detail-page";
import { Workbench } from "./traffic/workbench";
import { ReplayPage } from "./replay/replay-page";
import { SettingsPage } from "./settings/settings-page";

export function PluginApp({ host, context }: { host: PluginHost; context: PluginContext }) {
  if (context.kind === "settings-page") return <SettingsPage host={host} />;
  if (context.tool.kind === "traffic") return <Workbench host={host} context={context} />;
  const flowId = context.tool.entityId;
  if (!flowId) return <EmptyState>当前工具没有绑定流量</EmptyState>;
  if (context.tool.kind === "request-detail") return <DetailPage host={host} flowId={flowId} />;
  if (context.tool.kind === "traffic-replay") return <ReplayPage host={host} context={context} flowId={flowId} />;
  return <Notice>{`不支持的抓包工具：${context.tool.kind}`}</Notice>;
}
