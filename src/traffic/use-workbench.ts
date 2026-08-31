import { useCallback, useMemo } from "preact/hooks";
import type { TargetedPointerEvent } from "preact";
import { addTrafficReference, openTrafficTool } from "../api/traffic";
import { activeFilterCount, filterInput } from "../filter";
import type { FilterSettings, PluginHost, TrafficSummary, WorkspaceToolContext } from "../types";
import { useDebounced } from "../use-debounced";
import { useSettingsEffect, useTrafficDetailEffect, useTrafficEvents, useTrafficListEffect } from "./workbench-effects";
import { useWorkbenchState, type WorkbenchState } from "./workbench-state";

const MIN_LIST_HEIGHT = 160;
const FILTER_DELAY_MS = 250;

function paginationActions(state: WorkbenchState) {
  const previousPage = () => {
    const target = state.previous.at(-1); if (!state.previous.length) return;
    state.setPrevious((value) => value.slice(0, -1)); state.setCursor(target);
    state.setPage((value) => Math.max(1, value - 1)); state.setHasNewTraffic(false);
  };
  const nextPage = () => {
    if (!state.nextCursor) return;
    state.setPrevious((value) => [...value, state.cursor]); state.setCursor(state.nextCursor);
    state.setPage((value) => value + 1); state.setHasNewTraffic(false);
  };
  const latestPage = () => { state.resetPagination(); state.setRevision((value) => value + 1); };
  return { previousPage, nextPage, latestPage };
}

function listResize(state: WorkbenchState) {
  return (event: TargetedPointerEvent<HTMLDivElement>) => {
    event.preventDefault(); const startY = event.clientY; const start = state.listHeight;
    const move = (next: PointerEvent) => {
      const available = state.workbenchRef.current?.getBoundingClientRect().height ?? 720;
      const maximum = Math.max(MIN_LIST_HEIGHT, Math.floor(available * .45));
      state.setListHeight(Math.min(maximum, Math.max(MIN_LIST_HEIGHT, start + next.clientY - startY)));
    };
    const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
  };
}

export function useWorkbench(host: PluginHost, context: WorkspaceToolContext) {
  const state = useWorkbenchState();
  const debouncedFilter = useDebounced(state.filter, FILTER_DELAY_MS);
  const requestFilter = useMemo(() => filterInput(debouncedFilter), [debouncedFilter]);
  const applyFilter = useCallback((value: FilterSettings) => {
    state.setFilter(value); state.resetPagination();
  }, [state.resetPagination]);
  state.cursorRef.current = state.cursor;
  useSettingsEffect({ host, state });
  useTrafficListEffect({ host, visible: context.visible, state, filter: requestFilter });
  useTrafficDetailEffect({ host, visible: context.visible, state });
  useTrafficEvents({ host, visible: context.visible, state });
  const pages = paginationActions(state);
  const openDetail = (row: TrafficSummary) => openTrafficTool(host, {
    toolId: "request-detail", flowId: row.flow_id, title: `${row.method} ${row.host}`,
  });
  const openReplay = (row: TrafficSummary) => openTrafficTool(host, {
    toolId: "traffic-replay", flowId: row.flow_id, title: `重放 ${row.method} ${row.host}`,
  });
  const addReference = async () => { if (state.detail) await addTrafficReference(host, state.detail.flow_id); };
  return {
    ...state, ...pages, applyFilter, resizeList: listResize(state), openDetail, openReplay, addReference,
    selectedDetail: state.detail?.flow_id === state.selectedId ? state.detail : null,
    activeFilters: activeFilterCount(state.filter),
    canAddReference: context.workspace.canAddComposerReference === true,
    sessionId: context.workspace.session?.session_id ?? context.workspace.binding?.sessionId ?? "",
  };
}

export type WorkbenchModel = ReturnType<typeof useWorkbench>;
