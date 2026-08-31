import { useEffect, useState } from "preact/hooks";
import { getTraffic, openTrafficTool } from "../api/traffic";
import { flowSnapshot, requestRaw, responseRaw } from "../proxy";
import type { PluginHost, TrafficDetail } from "../types";
import { Button, EmptyState, Notice, Spinner } from "../ui/primitives";
import { MessagePane } from "./message-pane";

export function DetailPage({ host, flowId }: { host: PluginHost; flowId: string }) {
  const [detail, setDetail] = useState<TrafficDetail>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true; setError(undefined); setDetail(undefined);
    void getTraffic(host, flowId).then((value) => { if (active) setDetail(value); }).catch((reason) => { if (active) setError(String(reason)); });
    return () => { active = false; };
  }, [flowId, host]);
  if (error) return <Notice>{`读取流量详情失败：${error}`}</Notice>;
  if (!detail) return <Spinner label="正在加载流量详情…" />;
  const snapshot = flowSnapshot(detail.payload);
  return <section className="traffic-workbench" style={{ "--traffic-list-height": "0px", "grid-template-rows": "auto minmax(0, 1fr)" }}>
    <div className="traffic-detail-toolbar"><div><strong>{detail.method} {detail.url}</strong><span>{detail.status ?? "无响应"}</span></div><Button icon="play" onClick={() => void openTrafficTool(host, { toolId: "traffic-replay", flowId, title: `重放 ${detail.method} ${detail.host}` })}>发送到重放器</Button></div>
    <div className="traffic-message-grid">{snapshot.request || snapshot.response ? <><MessagePane title="Request" section={snapshot.request} raw={requestRaw(detail)} /><MessagePane title="Response" section={snapshot.response} raw={responseRaw(detail)} /></> : <EmptyState>该流量没有可显示的报文内容</EmptyState>}</div>
  </section>;
}
