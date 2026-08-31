import { useCallback, useRef, useState } from "preact/hooks";
import { defaultFilterSettings } from "../filter";
import type { FilterSettings, TrafficDetail, TrafficSummary } from "../types";

const DEFAULT_LIST_HEIGHT = 220;

export function useWorkbenchState() {
  const [defaults, setDefaults] = useState<FilterSettings>();
  const [filter, setFilter] = useState<FilterSettings>(defaultFilterSettings());
  const [rows, setRows] = useState<TrafficSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TrafficDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const detailRequest = useRef(0);
  const refreshTimer = useRef<number>();
  const resetPagination = useCallback(() => {
    detailRequest.current += 1;
    setSelectedId(null); setDetail(null); setCursor(undefined); setPrevious([]);
    setNextCursor(null); setPage(1); setHasNewTraffic(false);
  }, []);
  return {
    defaults, setDefaults, filter, setFilter, rows, setRows, selectedId, setSelectedId,
    detail, setDetail, loading, setLoading, detailLoading, setDetailLoading, error, setError,
    filterOpen, setFilterOpen, listHeight, setListHeight, cursor, setCursor, previous, setPrevious,
    nextCursor, setNextCursor, page, setPage, revision, setRevision, settingsRevision,
    setSettingsRevision, hasNewTraffic, setHasNewTraffic, workbenchRef, cursorRef, listRequest,
    detailRequest, refreshTimer, resetPagination,
  };
}

export type WorkbenchState = ReturnType<typeof useWorkbenchState>;
