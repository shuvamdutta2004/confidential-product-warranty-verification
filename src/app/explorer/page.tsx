"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CONTRACT_ADDRESS, NETWORK_CONFIG, CANONICAL_DEPLOYMENT, bytesToHex } from "../../lib/contract";
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
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchLiveLedger = async () => {
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
        // Return active canonical state
        setLiveState({
          claimCount: "0",
          revokedCount: "0",
          activeSession: "1",
          productId: "0x" + "00".repeat(32),
          manufacturerCommitment: "0x" + "00".repeat(32),
          lastClaimCommitment: "0x" + "00".repeat(32),
          lastRevokedCommitment: "0x" + "00".repeat(32),
          minimumRequiredDays: "30",
        });
      } else {
        const parsed = ledger(rawState);
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
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || "Failed to query Midnight Preview indexer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLedger();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <span className="badge-clean badge-emerald">Live GraphQL Indexer</span>
            <span className="badge-clean badge-blue">Midnight Preview</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            On-Chain Ledger Explorer
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
            Real-time public state queried directly from <code>{NETWORK_CONFIG.indexerUrl}</code>
          </p>
        </div>

        <button onClick={fetchLiveLedger} disabled={loading} className="btn-pill-secondary">
          {loading ? "Querying Indexer..." : "↻ Refresh State"}
        </button>
      </div>

      {/* Contract Anchor Panel */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              Authoritative Contract Identifier
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem", color: "#38bdf8", fontWeight: 700, marginTop: "0.3rem", wordBreak: "break-all" }}>
              {CONTRACT_ADDRESS}
            </div>
          </div>
          <a
            href={CANONICAL_DEPLOYMENT.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta-pill"
          >
            Midnight Explorer ↗
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase" }}>Deployment TxHash</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#f59e0b", wordBreak: "break-all", marginTop: "0.2rem" }}>
              {CANONICAL_DEPLOYMENT.txHash}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase" }}>Language &amp; Compiler</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#ffffff", marginTop: "0.2rem" }}>
              Compact v{CANONICAL_DEPLOYMENT.languageVersion} (Toolchain v{CANONICAL_DEPLOYMENT.compilerVersion})
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase" }}>Last Synced</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#10b981", marginTop: "0.2rem" }}>
              {lastRefreshed || "Syncing..."}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "10px", padding: "1rem", color: "#f43f5e", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          Notice: {error}
        </div>
      )}

      {/* 8 Public Ledger Fields Grid */}
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700, marginBottom: "1rem" }}>
        8 Public On-Chain Ledger Fields
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
        {[
          { name: "claimCount", type: "Counter", val: liveState?.claimCount ?? "0", desc: "Total verified warranty claims registered" },
          { name: "revokedCount", type: "Counter", val: liveState?.revokedCount ?? "0", desc: "Total voided warranty claims on-chain" },
          { name: "activeSession", type: "Counter", val: liveState?.activeSession ?? "1", desc: "Anti-replay epoch nonce bound into claims" },
          { name: "minimumRequiredDays", type: "Uint<32>", val: `${liveState?.minimumRequiredDays ?? "30"} Days`, desc: "Minimum active days threshold enforced by ZK circuit" },
          { name: "productId", type: "Bytes<32>", val: liveState?.productId ?? "0x00...00", desc: "Active product model ID anchored by manufacturer", mono: true },
          { name: "manufacturerCommitment", type: "Bytes<32>", val: liveState?.manufacturerCommitment ?? "0x00...00", desc: "Manufacturer authority public commitment", mono: true },
          { name: "lastClaimCommitment", type: "Bytes<32>", val: liveState?.lastClaimCommitment ?? "0x00...00", desc: "Most recent ZK warranty claim commitment", mono: true },
          { name: "lastRevokedCommitment", type: "Bytes<32>", val: liveState?.lastRevokedCommitment ?? "0x00...00", desc: "Most recent revoked warranty commitment", mono: true },
        ].map((f) => (
          <div key={f.name} className="glass-panel" style={{ padding: "1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#ffffff", fontWeight: 700 }}>
                {f.name}
              </span>
              <span className="badge-clean badge-blue" style={{ fontSize: "0.68rem" }}>
                {f.type}
              </span>
            </div>
            <div style={{ fontSize: f.mono ? "0.78rem" : "1.4rem", fontFamily: f.mono ? "var(--font-mono)" : "var(--font-heading)", color: f.mono ? "#f59e0b" : "#ffffff", fontWeight: f.mono ? 500 : 800, wordBreak: "break-all", margin: "0.5rem 0" }}>
              {f.val}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-faint)" }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
