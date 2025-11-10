"use client";

import React from "react";
import { usePriceFeed } from "../hooks/usePriceFeed";

const TOKENS_ORDER = ["AUXG", "AUXPD", "AUXPT", "AUXS"];

export const LiveMarkets: React.FC = () => {
  const { prices, connected, lastUpdate } = usePriceFeed();
  const entries = TOKENS_ORDER
    .map((sym) => prices[sym])
    .filter(Boolean);

  const fmtTime = (ts?: number | null) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      style={{
        padding: "18px 22px",
        borderRadius: "18px",
        background: "#111",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#f9fafb",
        fontSize: "13px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "10px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontWeight: 600,
            }}
          >
            <span>Live Markets</span>
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 999,
                background: "rgba(22,163,74,0.12)",
                color: "#22c55e",
              }}
            >
              ● Real-time
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              opacity: 0.5,
              marginTop: 2,
            }}
          >
            Real-time prices from Auxite watcher
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            fontSize: 10,
            opacity: 0.7,
          }}
        >
          <div
            style={{
              color: connected ? "#22c55e" : "#f97316",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "999px",
                backgroundColor: connected ? "#22c55e" : "#f97316",
              }}
            />
            {connected ? "Live" : "Waiting for feed..."}
          </div>
          <div>
            Last update:{" "}
            {lastUpdate ? fmtTime(lastUpdate) : "—"}
          </div>
        </div>
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "6px 0",
                fontWeight: 500,
                opacity: 0.6,
              }}
            >
              Token
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "6px 0",
                fontWeight: 500,
                opacity: 0.6,
              }}
            >
              Chain
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "6px 0",
                fontWeight: 500,
                opacity: 0.6,
              }}
            >
              Price (USD)
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "6px 0",
                fontWeight: 500,
                opacity: 0.6,
              }}
            >
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {TOKENS_ORDER.map((symbol) => {
            const p = prices[symbol];
            return (
              <tr key={symbol}>
                <td
                  style={{
                    padding: "7px 0",
                    borderTop: "1px solid rgba(148,163,253,0.03)",
                  }}
                >
                  {symbol}
                </td>
                <td
                  style={{
                    padding: "7px 0",
                    borderTop: "1px solid rgba(148,163,253,0.03)",
                    opacity: 0.5,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "7px 0",
                    borderTop: "1px solid rgba(148,163,253,0.03)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {p
                    ? p.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })
                    : "—"}
                </td>
                <td
                  style={{
                    padding: "7px 0",
                    borderTop: "1px solid rgba(148,163,253,0.03)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    opacity: 0.55,
                  }}
                >
                  {p ? fmtTime(p.ts) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
