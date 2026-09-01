import { useCallback, useRef, useState } from "preact/hooks";
import type { ReplayAttempt, TrafficDetail } from "../types";

export function useReplayState() {
  const [source, setSource] = useState<TrafficDetail>();
  const [sourceRevision, setSourceRevision] = useState(0);
  const [rawRequest, setRawRequest] = useState("");
  const [scheme, setScheme] = useState<"http" | "https">("https");
  const [targetHost, setTargetHost] = useState("");
  const [targetPort, setTargetPort] = useState(443);
  const [attempts, setAttempts] = useState<ReplayAttempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<TrafficDetail>();
  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const [resultError, setResultError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panePercent, setPanePercent] = useState(50);
  const [stacked, setStacked] = useState(false);
  const exchangeRef = useRef<HTMLDivElement>(null);
  const drafts = useRef(new Map<string, string>());
  const replaceAttempts = useCallback((items: ReplayAttempt[], selectLatest: boolean) => {
    setAttempts(items);
    setSelectedId((current) => selectLatest ? items.at(-1)?.id ?? null : current && items.some((item) => item.id === current) ? current : items.at(-1)?.id ?? null);
  }, []);
  return {
    source, setSource, sourceRevision, setSourceRevision, rawRequest, setRawRequest, scheme, setScheme, targetHost, setTargetHost,
    targetPort, setTargetPort, attempts, setAttempts, selectedId, setSelectedId, result, setResult,
    loading, setLoading, resultLoading, setResultLoading, sending, setSending, error, setError,
    resultError, setResultError, notice, setNotice, connectionOpen, setConnectionOpen, confirmOpen, setConfirmOpen, panePercent,
    setPanePercent, stacked, setStacked, exchangeRef, drafts, replaceAttempts,
  };
}

export type ReplayState = ReturnType<typeof useReplayState>;
