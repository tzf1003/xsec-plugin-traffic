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

export function requiresSensitiveHostConfirmation(options: {
  sourceHost: string;
  targetHost: string;
  rawRequest: string;
}): boolean {
  const normalized = options.rawRequest.replace(/\r\n/gu, "\n");
  const head = normalized.split("\n\n", 1)[0] ?? normalized;
  const lines = head.split("\n");
  const requestHost = lines.slice(1).find((line) => /^host\s*:/iu.test(line))?.replace(/^host\s*:/iu, "").trim();
  const sourceHost = normalizeAuthorityHost(options.sourceHost);
  const targetHost = normalizeAuthorityHost(options.targetHost);
  const requestAuthority = requestHost ? normalizeAuthorityHost(requestHost) : undefined;
  const absoluteAuthority = parseAbsoluteFormAuthority(lines[0] ?? "");
  if (
    sourceHost === targetHost
    && (requestAuthority === undefined || sourceHost === requestAuthority)
    && (absoluteAuthority === undefined || sourceHost === absoluteAuthority)
  ) return false;
  return head.split("\n").slice(1).some((line) => {
    if (line.startsWith(" ") || line.startsWith("\t")) return false;
    const separator = line.indexOf(":");
    if (separator < 0) return false;
    const name = line.slice(0, separator).trim().toLowerCase();
    return name === "authorization" || name === "cookie";
  });
}

function parseAbsoluteFormAuthority(startLine: string): string | undefined {
  const requestTarget = startLine.trim().split(/\s+/u)[1];
  if (!requestTarget || !/^https?:\/\//iu.test(requestTarget)) return undefined;
  try {
    return normalizeAuthorityHost(new URL(requestTarget).host);
  } catch {
    return undefined;
  }
}

function normalizeAuthorityHost(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("[")) {
    const closing = normalized.indexOf("]");
    return closing > 0 ? normalized.slice(1, closing) : normalized;
  }
  const separator = normalized.lastIndexOf(":");
  const singleColon = separator === normalized.indexOf(":");
  return singleColon && separator > 0 && /^\d+$/u.test(normalized.slice(separator + 1))
    ? normalized.slice(0, separator)
    : normalized;
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
