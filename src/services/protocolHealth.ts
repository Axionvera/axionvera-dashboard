import {
  AXIONVERA_TOKEN_CONTRACT_ID,
  AXIONVERA_VAULT_CONTRACT_ID,
  HORIZON_URL,
  NETWORK,
  SOROBAN_RPC_URL,
} from "@/utils/networkConfig";
import { getApiClient } from "@/utils/enhancedApiClient";

export type ProtocolHealthStatus = "operational" | "degraded" | "down";

export type ProtocolHealthMetric = {
  id: string;
  label: string;
  description: string;
  value: string;
  status: ProtocolHealthStatus;
  latencyMs?: number;
  checkedAt: string;
};

export type ProtocolHealthSnapshot = {
  status: ProtocolHealthStatus;
  summary: string;
  checkedAt: string;
  nextCheckInMs: number;
  metrics: ProtocolHealthMetric[];
  latencyTrend: Array<{ label: string; latencyMs: number; status: ProtocolHealthStatus }>;
};

type ProbeResult = {
  ok: boolean;
  latencyMs?: number;
  message: string;
};

const DEFAULT_TIMEOUT_MS = 4500;
export const DEFAULT_PROTOCOL_HEALTH_POLL_MS = 30000;

function isConfigured(value: string) {
  return Boolean(value && !value.startsWith("REPLACE_WITH_"));
}

function metricStatus(ok: boolean, latencyMs?: number): ProtocolHealthStatus {
  if (!ok) return "down";
  if (latencyMs && latencyMs > 2500) return "degraded";
  return "operational";
}

function summarizeStatus(statuses: ProtocolHealthStatus[]): ProtocolHealthStatus {
  if (statuses.some((status) => status === "down")) return "down";
  if (statuses.some((status) => status === "degraded")) return "degraded";
  return "operational";
}

async function probeEndpoint(
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ProbeResult> {
  const startedAt = performance.now();

  try {
    const client = getApiClient();
    const response = await client.request(url, {
      ...options,
      timeout: timeoutMs,
      retryPolicy: 'none',
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    return {
      ok: response.success,
      latencyMs,
      message: response.success ? `${response.statusCode || 200} OK` : response.error?.message || "Endpoint probe failed",
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    return {
      ok: false,
      latencyMs,
      message: error instanceof Error ? error.message : "Endpoint probe failed",
    };
  }
}

export async function getProtocolHealthSnapshot(): Promise<ProtocolHealthSnapshot> {
  const checkedAt = new Date().toISOString();

  const [rpcProbe, horizonProbe] = await Promise.all([
    probeEndpoint(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "protocol-health",
        method: "getHealth",
      }),
    }),
    probeEndpoint(`${HORIZON_URL.replace(/\/$/, "")}/`, { method: "GET" }),
  ]);

  const contractConfigured = isConfigured(AXIONVERA_VAULT_CONTRACT_ID) && isConfigured(AXIONVERA_TOKEN_CONTRACT_ID);
  const rpcStatus = metricStatus(rpcProbe.ok, rpcProbe.latencyMs);
  const horizonStatus = metricStatus(horizonProbe.ok, horizonProbe.latencyMs);
  const contractStatus: ProtocolHealthStatus = contractConfigured ? "operational" : "degraded";
  const eventStatus: ProtocolHealthStatus = rpcStatus === "operational" ? "operational" : "degraded";
  const transactionStatus: ProtocolHealthStatus =
    rpcStatus === "operational" && horizonStatus !== "down" && contractConfigured ? "operational" : "degraded";

  const metrics: ProtocolHealthMetric[] = [
    {
      id: "soroban-rpc",
      label: "Soroban RPC",
      description: "Protocol write/read path for contract simulation and submission.",
      value: rpcProbe.message,
      status: rpcStatus,
      latencyMs: rpcProbe.latencyMs,
      checkedAt,
    },
    {
      id: "horizon",
      label: "Horizon Indexer",
      description: "Stellar account and ledger indexing endpoint used by the dashboard.",
      value: horizonProbe.message,
      status: horizonStatus,
      latencyMs: horizonProbe.latencyMs,
      checkedAt,
    },
    {
      id: "contract-config",
      label: "Contract Configuration",
      description: `Vault and token contract IDs for ${NETWORK}.`,
      value: contractConfigured ? "Vault and token contracts configured" : "Contract IDs need environment configuration",
      status: contractStatus,
      checkedAt,
    },
    {
      id: "event-stream",
      label: "Event Stream",
      description: "Soroban event stream readiness for automatic dashboard refreshes.",
      value: rpcStatus === "operational" ? "Ready for event-backed refresh" : "Waiting on healthy RPC",
      status: eventStatus,
      checkedAt,
    },
    {
      id: "transaction-flow",
      label: "Transaction Flow",
      description: "Combined readiness for deposits, withdrawals, and reward claims.",
      value: transactionStatus === "operational" ? "Ready" : "Limited until dependencies recover",
      status: transactionStatus,
      checkedAt,
    },
  ];

  const status = summarizeStatus(metrics.map((metric) => metric.status));

  return {
    status,
    summary:
      status === "operational"
        ? "All monitored protocol dependencies are healthy."
        : status === "degraded"
          ? "One or more protocol dependencies need attention."
          : "A critical protocol dependency is unavailable.",
    checkedAt,
    nextCheckInMs: DEFAULT_PROTOCOL_HEALTH_POLL_MS,
    metrics,
    latencyTrend: [
      { label: "RPC", latencyMs: rpcProbe.latencyMs ?? 0, status: rpcStatus },
      { label: "Horizon", latencyMs: horizonProbe.latencyMs ?? 0, status: horizonStatus },
    ],
  };
}
