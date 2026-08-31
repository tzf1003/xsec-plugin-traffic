import { useCallback } from "preact/hooks";
import type { TargetedPointerEvent } from "preact";
import { getReplayAttempts, openTrafficTool, replayTraffic } from "../api/traffic";
import type { PluginHost, ReplayAttempt, ReplayResult } from "../types";
import { useReplayEvents, useReplayLayout, useReplayResult, useReplaySource } from "./replay-effects";
import { useReplayState, type ReplayState } from "./replay-state";

const MIN_PANE_PERCENT = 25;
const MAX_PANE_PERCENT = 75;

function includeResponseAttempt(history: ReplayAttempt[], response: ReplayResult, state: ReplayState) {
  if (!response.attempt || history.some((item) => item.id === response.attempt?.id)) return history;
  const items = [...history, response.attempt];
  state.replaceAttempts(items, true);
  return items;
}

function applyLatestDraft(history: ReplayAttempt[], state: ReplayState) {
  const latest = history.at(-1);
  if (!latest) return;
  state.drafts.current.set(latest.id, latest.request_raw);
  state.setRawRequest(latest.request_raw);
}

function replayNotice(response: ReplayResult): string {
  if (response.capture_pending) return "请求已返回，响应流量仍在入库";
  return `重放完成：HTTP ${response.result?.status ?? response.response_status ?? "—"}`;
}

function replayResize(state: ReplayState) {
  return (event: TargetedPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const move = (next: PointerEvent) => {
      const bounds = state.exchangeRef.current?.getBoundingClientRect(); if (!bounds) return;
      const value = state.stacked ? ((next.clientY - bounds.top) / bounds.height) * 100 : ((next.clientX - bounds.left) / bounds.width) * 100;
      state.setPanePercent(Math.min(MAX_PANE_PERCENT, Math.max(MIN_PANE_PERCENT, value)));
    };
    const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
  };
}

export function useReplay(host: PluginHost, flowId: string, visible: boolean) {
  const state = useReplayState();
  const selected = state.attempts.find((attempt) => attempt.id === state.selectedId) ?? null;
  const selectedIndex = state.attempts.findIndex((attempt) => attempt.id === state.selectedId);
  const refreshHistory = useCallback(async (selectLatest: boolean) => {
    const history = await getReplayAttempts(host, flowId);
    state.replaceAttempts(history, selectLatest); return history;
  }, [flowId, host, state.replaceAttempts]);
  useReplaySource({ host, flowId, state });
  useReplayResult({ host, resultId: selected?.result_flow_id, state });
  useReplayLayout(state);
  useReplayEvents({ host, visible, refreshHistory, setError: state.setError });
  const selectAttempt = (index: number) => {
    const attempt = state.attempts[index]; if (!attempt) return;
    state.drafts.current.set(state.selectedId ?? "draft", state.rawRequest); state.setSelectedId(attempt.id);
    state.setRawRequest(state.drafts.current.get(attempt.id) ?? attempt.request_raw);
    state.setScheme(attempt.scheme === "http" ? "http" : "https");
    state.setTargetHost(attempt.target_host); state.setTargetPort(attempt.target_port);
  };
  const send = async (confirmed = false) => {
    if (!state.source || !state.targetHost.trim() || !state.rawRequest.trim()) return;
    state.setSending(true); state.setError(undefined); state.setNotice(undefined);
    try {
      const response = await replayTraffic(host, {
        sourceFlowId: state.source.flow_id, rawRequest: state.rawRequest, scheme: state.scheme,
        targetHost: state.targetHost.trim(), targetPort: state.targetPort, confirmSensitiveHostChange: confirmed,
      });
      const history = includeResponseAttempt(await refreshHistory(true), response, state);
      applyLatestDraft(history, state); state.setNotice(replayNotice(response));
    } catch (reason) {
      const detail = String(reason);
      if (!confirmed && detail.includes("Cookie/Authorization")) state.setConfirmOpen(true);
      else state.setError(detail);
    } finally { state.setSending(false); }
  };
  const openResult = () => {
    if (!state.result) return;
    void openTrafficTool(host, {
      toolId: "request-detail",
      flowId: state.result.flow_id,
      title: `${state.result.method} ${state.result.host}`,
    });
  };
  return { ...state, selected, selectedIndex, selectAttempt, refreshHistory, send, resize: replayResize(state), openResult };
}

export type ReplayModel = ReturnType<typeof useReplay>;
