import type { FlowSection, FlowSnapshot, TrafficDetail } from "./types";

export function flowSnapshot(value: unknown): FlowSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as FlowSnapshot;
}

export function headerPairs(headers?: FlowSection["headers"]): [string, string][] {
  if (Array.isArray(headers)) return headers;
  return headers ? Object.entries(headers) : [];
}

export function renderSection(section?: FlowSection): string {
  if (!section) return "";
  const lines = section.line ? [section.line] : [];
  for (const [name, value] of headerPairs(section.headers)) lines.push(`${name}: ${value}`);
  const head = lines.join("\r\n");
  return section.body === undefined ? head : `${head}\r\n\r\n${section.body}`;
}

export function requestRaw(detail: TrafficDetail): string {
  const snapshot = flowSnapshot(detail.payload);
  return snapshot.raw_request ?? renderSection(snapshot.request);
}

export function responseRaw(detail: TrafficDetail): string {
  const snapshot = flowSnapshot(detail.payload);
  return snapshot.raw_response ?? renderSection(snapshot.response);
}

export function prettyBody(body?: string): string {
  if (!body) return "";
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function ensureHost(raw: string, options: {
  host: string;
  port: number | null | undefined;
  scheme: string;
}): string {
  const separator = raw.includes("\r\n") ? "\r\n" : "\n";
  const boundaryIndex = raw.indexOf(`${separator}${separator}`);
  const head = boundaryIndex < 0 ? raw : raw.slice(0, boundaryIndex);
  if (/^host\s*:/im.test(head)) return raw;
  const firstBreak = raw.indexOf(separator);
  if (firstBreak < 0) return raw;
  const normalized = options.host.includes(":") && !options.host.startsWith("[")
    ? `[${options.host}]`
    : options.host;
  const defaultPort = options.scheme === "https" ? 443 : 80;
  const authority = options.port && options.port !== defaultPort
    ? `${normalized}:${options.port}`
    : normalized;
  return `${raw.slice(0, firstBreak + separator.length)}Host: ${authority}${separator}${raw.slice(firstBreak + separator.length)}`;
}
