"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CONTRACT_ADDRESS, NETWORK_CONFIG, bytesToHex } from "../../lib/contract";
import { ledger } from "../../../managed/contract/index.js";

export default function ExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [liveState, setLiveState] = useState<{
    claimCount: string;
    revokedCount: string;
    activeSession: string;
    productId: string;
    manufacturerCommitment: string;
    lastClaimCommitment: string;
    lastRevokedCommitment: string;
    minimumRequiredDays: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawLength, setRawLength] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveLedger() {
      try {
        setLoading(true);
        setError(null);
        const query = `
          query GetContractState($address: String!) {
            contract(address: $address) {
              address
              state
            }
          }
        `;
        const res = await fetch(NETWORK_CONFIG.indexerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            variables: { address: CONTRACT_ADDRESS.toLowerCase() },
          }),
        });

        if (!res.ok) {
          throw new Error(`Indexer responded with HTTP ${res.status}`);
        }

        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          throw new Error(json.errors.map((e: any) => e.message).join(", "));
        }

        const rawState = json?.data?.contract?.state;
        if (!rawState) {
          throw new Error("No public ledger state returned from Midnight Preview indexer.");
        }

        const parsed = ledger(rawState);
        if (isMounted) {
          setRawLength(rawState.length);
          setLiveState({
            claimCount: parsed.claimCount.toString(),
            revokedCount: parsed.revokedCount.toString(),
            activeSession: parsed.activeSession.toString(),
            productId: bytesToHex(parsed.productId),
            manufacturerCommitment: bytesToHex(parsed.manufacturerCommitment),
            lastClaimCommitment: bytesToHex(parsed.lastClaimCommitment),
            lastRevokedCommitment: bytesToHex(parsed.lastRevokedCommitment),
            minimumRequiredDays: parsed.minimumRequiredDays.toString(),
          });
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to query Midnight Preview indexer.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLiveLedger();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge badge-cyan">Midnight Explorer</span>
          <span className="badge badge-green">Preview Network</span>
        </div>
        <h1 className="section-title">Contract Explorer</h1>
        <p className="section-desc">
          Live on-chain state of the Confidential Product Warranty Verification ZK contract on Midnight Preview.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#64748b",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Contract Address
        </div>
        <code style={{ fontSize: "0.82rem", color: "#06b6d4", wordBreak: "break-all" }}>
          {CONTRACT_ADDRESS}
        </code>
        <div style={{ marginTop: "1rem" }}>
          <a
            href={`https://preview.midnightexplorer.com/contracts/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: "inline-flex" }}
          >
            ↗ View on Midnight Explorer
          </a>
        </div>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Public Ledger Fields (8)
          </div>
          <span
            style={{
              fontSize: "0.72rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              background: loading ? "rgba(245,158,11,0.15)" : error ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              color: loading ? "#f59e0b" : error ? "#ef4444" : "#10b981",
              fontFamily: "monospace",
            }}
          >
            {loading ? "Querying Indexer..." : error ? "Query Error" : `Live State Verified (${rawLength} bytes)`}
          </span>
        </div>

        {error && (
          <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "6px", color: "#ef4444", fontSize: "0.78rem", marginBottom: "1rem" }}>
            Indexer Error: {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { field: "claimCount: Counter", val: liveState?.claimCount, desc: "Total verified warranty claims filed", color: "#e11d48" },
            { field: "revokedCount: Counter", val: liveState?.revokedCount, desc: "Total revoked/voided warranties", color: "#ef4444" },
            { field: "activeSession: Counter", val: liveState?.activeSession, desc: "Epoch nonce (replay protection)", color: "#06b6d4" },
            { field: "productId: Bytes<32>", val: liveState?.productId, desc: "Active product model identifier", color: "#10b981" },
            { field: "manufacturerCommitment: Bytes<32>", val: liveState?.manufacturerCommitment, desc: "Manufacturer public authority anchor", color: "#f59e0b" },
            { field: "lastClaimCommitment: Bytes<32>", val: liveState?.lastClaimCommitment, desc: "Most recent ZK warranty claim hash", color: "#8b5cf6" },
            { field: "lastRevokedCommitment: Bytes<32>", val: liveState?.lastRevokedCommitment, desc: "Most recent revoked commitment hash", color: "#ef4444" },
            { field: "minimumRequiredDays: Uint<32>", val: liveState ? `${liveState.minimumRequiredDays} days` : undefined, desc: "Minimum active warranty days required", color: "#06b6d4" },
          ].map((f) => (
            <div
              key={f.field}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.6rem 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <code style={{ fontSize: "0.78rem", color: f.color, display: "block" }}>{f.field}</code>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{f.desc}</span>
              </div>
              {f.val && (
                <div style={{ textAlign: "right" }}>
                  <code style={{ fontSize: "0.75rem", color: "#e2e8f0", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                    {f.val.length > 20 ? f.val.substring(0, 10) + "..." + f.val.substring(f.val.length - 8) : f.val}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/" className="btn-secondary">
          Back to Dashboard
        </Link>
        <Link href="/claim" className="btn-primary">
          File Warranty Claim
        </Link>
      </div>
    </div>
  );
}