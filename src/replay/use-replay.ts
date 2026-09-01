import { useCallback, useRef } from "preact/hooks";
import type { TargetedPointerEvent } from "preact";
import { getReplayAttempts, openTrafficTool, replayTraffic } from "../api/traffic";
import { requiresSensitiveHostConfirmation } from "../proxy";
import type { PluginHost, ReplayAttempt, ReplayResult } from "../types";
import { replayFeedback } from "./feedback";
import { useReplayEvents, useReplayLayout, useReplayResult, useReplaySource } from "./replay-effects";
import { useReplayState, type ReplayState } from "./replay-state";
import { replayScheme, replayTargetError } from "./target";

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

function useReplayHistory(options: { host: PluginHost; flowId: string; state: ReplayState }) {
  const { host, flowId, state } = options;
  const tail = useRef<Promise<void>>(Promise.resolve());
  const identity = useRef({ host, flowId }); identity.current = { host, flowId };
  return useCallback((selectLatest: boolean) => {
    const requested = { host, flowId };
    const request = tail.current.then(async () => {
      const history = await getReplayAttempts(host, flowId);
      const current = identity.current;
      if (current.host === requested.host && current.flowId === requested.flowId) {
        state.replaceAttempts(history, selectLatest);
      }
      return history;
    });
    tail.current = request.then(() => undefined, () => undefined);
    return request;
  }, [flowId, host, state.replaceAttempts]);
}

async function sendReplay(options: {
  host: PluginHost; state: ReplayState; confirmed: boolean;
  refreshHistory: (selectLatest: boolean) => Promise<ReplayAttempt[]>;
}) {
  const { host, state, confirmed, refreshHistory } = options;
  if (!state.source || !state.rawRequest.trim()) return;
  state.setError(undefined); state.setNotice(undefined);
  const validationError = replayTargetError(state.targetHost, state.targetPort);
  if (validationError) { state.setError(validationError); return; }
  const targetHost = state.targetHost.trim();
  if (!confirmed && requiresSensitiveHostConfirmation({
    sourceHost: state.source.host, targetHost, rawRequest: state.rawRequest,
  })) {
    state.setConfirmOpen(true); return;
  }
  state.setSending(true);
  try {
    const response = await replayTraffic(host, {
      sourceFlowId: state.source.flow_id, rawRequest: state.rawRequest, scheme: state.scheme,
      targetHost, targetPort: state.targetPort, confirmSensitiveHostChange: confirmed,
    });
    const history = includeResponseAttempt(await refreshHistory(true), response, state);
    applyLatestDraft(history, state);
    const feedback = replayFeedback(response);
    if (feedback.kind === "error") state.setError(feedback.message);
    else state.setNotice(feedback.message);
  } catch (reason) { state.setError(String(reason)); }
  finally { state.setSending(false); }
}

async function openReplayResult(host: PluginHost, state: ReplayState) {
  if (!state.result) return;
  state.setError(undefined);
  try {
    await openTrafficTool(host, {
      toolId: "request-detail", flowId: state.result.flow_id,
      title: `${state.result.method} ${state.result.host}`,
    });
  } catch (reason) { state.setError(`打开结果流量失败：${String(reason)}`); }
}

export function useReplay(host: PluginHost, flowId: string, visible: boolean) {
  const state = useReplayState();
  const selected = state.attempts.find((attempt) => attempt.id === state.selectedId) ?? null;
  const selectedIndex = state.attempts.findIndex((attempt) => attempt.id === state.selectedId);
  const refreshHistory = useReplayHistory({ host, flowId, state });
  useReplaySource({ host, flowId, state, refreshHistory });
  useReplayResult({ host, resultId: selected?.result_flow_id, state });
  useReplayLayout(state);
  useReplayEvents({ host, visible, refreshHistory, setError: state.setError });
  const selectAttempt = (index: number) => {
    const attempt = state.attempts[index]; if (!attempt) return;
    state.drafts.current.set(state.selectedId ?? "draft", state.rawRequest); state.setSelectedId(attempt.id);
    state.setRawRequest(state.drafts.current.get(attempt.id) ?? attempt.request_raw);
    state.setScheme(replayScheme(attempt.scheme));
    state.setTargetHost(attempt.target_host); state.setTargetPort(attempt.target_port);
  };
  const send = (confirmed = false) => sendReplay({ host, state, confirmed, refreshHistory });
  const openResult = () => openReplayResult(host, state);
  const targetValid = replayTargetError(state.targetHost, state.targetPort) === undefined;
  return { ...state, selected, selectedIndex, targetValid, selectAttempt, refreshHistory, send, resize: replayResize(state), openResult };
}

export type ReplayModel = ReturnType<typeof useReplay>;
