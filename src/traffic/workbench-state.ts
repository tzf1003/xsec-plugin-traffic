import { useCallback, useRef, useState } from "preact/hooks";
import { defaultFilterSettings } from "../filter";
import { LatestTaskQueue } from "../latest-task-queue";
import type { FilterSettings, TrafficDetail, TrafficSummary } from "../types";

const DEFAULT_LIST_HEIGHT = 220;

export function useWorkbenchState() {
  const [defaults, setDefaults] = useState<FilterSettings>();
  const [filter, setFilter] = useState<FilterSettings>(defaultFilterSettings());
  const [rows, setRows] = useState<TrafficSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TrafficDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRevision, setDetailRevision] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [listHeight, setListHeight] = useState(DEFAULT_LIST_HEIGHT);
  const [cursor, setCursor] = useState<string>();
  const [previous, setPrevious] = useState<Array<string | undefined>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [settingsRevision, setSettingsRevision] = useState(0);
  const [hasNewTraffic, setHasNewTraffic] = useState(false);
  const workbenchRef = useRef<HTMLElement>(null);
  const cursorRef = useRef(cursor);
  const listRequest = useRef(0);
  const listQueue = useRef(new LatestTaskQueue());
  const detailRequest = useRef(0);
  const refreshTimer = useRef<number>();
  const prepareListTransition = useCallback(() => {
    listRequest.current += 1; detailRequest.current += 1;
    setRows([]); setSelectedId(null); setDetail(null); setDetailLoading(false); setDetailError(null);
    setNextCursor(null); setHasNewTraffic(false); setLoading(true);
  }, []);
  const resetPagination = useCallback(() => {
    prepareListTransition(); setCursor(undefined); setPrevious([]); setPage(1);
  }, [prepareListTransition]);
  return {
    defaults, setDefaults, filter, setFilter, rows, setRows, selectedId, setSelectedId,
    detail, setDetail, loading, setLoading, detailLoading, setDetailLoading, error, setError,
    detailError, setDetailError, detailRevision, setDetailRevision,
    filterOpen, setFilterOpen, listHeight, setListHeight, cursor, setCursor, previous, setPrevious,
    nextCursor, setNextCursor, page, setPage, revision, setRevision, settingsRevision,
    setSettingsRevision, hasNewTraffic, setHasNewTraffic, workbenchRef, cursorRef, listRequest,
    listQueue, detailRequest, refreshTimer, prepareListTransition, resetPagination,
  };
}

export type WorkbenchState = ReturnType<typeof useWorkbenchState>;
