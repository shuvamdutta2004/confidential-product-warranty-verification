"use client";

import { useState } from "react";
import { getClient } from "../../lib/contract";
import Link from "next/link";

export default function AdminPage() {
  const [manufacturerKey, setManufacturerKey] = useState("");
  const [mfrMinDays, setMfrMinDays] = useState(30);
  const [loadingMfr, setLoadingMfr] = useState(false);

  const [productId, setProductId] = useState("prod_macbook_pro_m3_2027");
  const [resetMinDays, setResetMinDays] = useState(60);
  const [loadingReset, setLoadingReset] = useState(false);

  const [revokeCommitment, setRevokeCommitment] = useState("");
  const [loadingRevoke, setLoadingRevoke] = useState(false);

  const [loadingSession, setLoadingSession] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const addLog = (msg: string, type = "info") => setLogs((l) => [...l, { msg, type }]);

  const requireKey = () => {
    if (!manufacturerKey.trim()) {
      addLog("> [ERROR] Manufacturer Signing Key is required for authorized ZK operations.", "error");
      return false;
    }
    return true;
  };

  const handleSetManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireKey()) return;
    setLoadingMfr(true);
    setLogs([]);
    setResult(null);

    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] manufacturerSigningKey() - authorized root key injected into circuit", "info");
      addLog(`> [CIRCUIT] Executing setManufacturerCommitment(${mfrMinDays} days)...`, "info");
      const client = getClient();
      client.setManufacturerKey(manufacturerKey.trim());

      const res = await client.setManufacturerCommitment(mfrMinDays);
      addLog(`> [SUBMITTED] Transaction dispatched: ${res.txHash}`, "info");

      const conf = await client.waitForTransactionConfirmation(res.txHash);
      if (conf.confirmed) {
        addLog(`> [CONFIRMED] Authority commitment anchored on-chain! Block: ${conf.blockHeight ?? "Finalized"}`, "success");
      }

      setResult({ ...res, circuit: "setManufacturerCommitment(Uint<32>)" });
      addLog(`> [COMMITMENT] Public Authority Anchor: ${res.manufacturerCommitment}`, "success");
      addLog(`> [THRESHOLD] Minimum active warranty days set to ${res.newMinimumDays} days`, "success");
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message || err}`, "error");
    } finally {
      setLoadingMfr(false);
    }
  };

  const handleResetProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireKey()) return;
    setLoadingReset(true);
    setLogs([]);
    setResult(null);

    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [AUTHORIZATION] Verifying manufacturer authority commitment...", "info");
      addLog(`> [CIRCUIT] Executing resetProduct("${productId}", ${resetMinDays} days)...`, "info");
      const client = getClient();
      client.setManufacturerKey(manufacturerKey.trim());

      const res = await client.resetProduct(productId, resetMinDays);
      addLog(`> [SUBMITTED] Transaction dispatched: ${res.txHash}`, "info");

      const conf = await client.waitForTransactionConfirmation(res.txHash);
      if (conf.confirmed) {
        addLog(`> [CONFIRMED] Product model updated on Midnight Preview!`, "success");
      }

      setResult({ ...res, circuit: "resetProduct(Bytes<32>, Uint<32>)" });
      addLog(`> [SUCCESS] Active Product ID updated to: ${res.newProductId}`, "success");
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message || err}`, "error");
    } finally {
      setLoadingReset(false);
    }
  };

  const handleRevokeWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireKey()) return;
    if (!revokeCommitment.trim()) return;
    setLoadingRevoke(true);
    setLogs([]);
    setResult(null);

    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [AUTHORIZATION] Generating ZK authorization proof from manufacturer key...", "info");
      addLog(`> [CIRCUIT] Executing revokeWarranty(commitmentToRevoke)...`, "info");
      const client = getClient();
      client.setManufacturerKey(manufacturerKey.trim());

      const res = await client.revokeWarranty(revokeCommitment.trim());
      addLog(`> [SUBMITTED] Revocation transaction dispatched: ${res.txHash}`, "info");

      const conf = await client.waitForTransactionConfirmation(res.txHash);
      if (conf.confirmed) {
        addLog(`> [CONFIRMED] Warranty commitment voided & recorded on-chain!`, "success");
      }

      setResult({ ...res, circuit: "revokeWarranty(Bytes<32>)" });
      addLog(`> [REVOKED] Revoked Commitment: ${res.revokedCommitment}`, "success");
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message || err}`, "error");
    } finally {
      setLoadingRevoke(false);
    }
  };

  const handleIncrementSession = async () => {
    if (!requireKey()) return;
    setLoadingSession(true);
    setLogs([]);
    setResult(null);

    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [CIRCUIT] Executing incrementSession() - rotating epoch nonce...", "info");
      const client = getClient();
      client.setManufacturerKey(manufacturerKey.trim());

      const res = await client.incrementSession();
      addLog(`> [SUBMITTED] Increment transaction dispatched: ${res.txHash}`, "info");

      const conf = await client.waitForTransactionConfirmation(res.txHash);
      if (conf.confirmed) {
        addLog(`> [CONFIRMED] Active session nonce incremented! Stale customer proofs invalidated.`, "success");
      }

      setResult({ ...res, circuit: "incrementSession()" });
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message || err}`, "error");
    } finally {
      setLoadingSession(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <span className="badge-clean badge-amber">Circuits 3, 4, 5, 6</span>
          <span className="badge-clean badge-blue">Manufacturer Authority</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Manufacturer Administrative Console
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
          Authorized smart contract management. All administrative circuits strictly enforce zero-knowledge authorization against the manufacturer authority commitment.
        </p>
      </div>

      {/* Global Manufacturer Key Input (Required for all actions) */}
      <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", borderLeft: "4px solid #f59e0b" }}>
        <label className="field-label" style={{ color: "#ffffff", fontSize: "0.9rem" }}>
          🔑 Manufacturer Signing Key (ZK Administrative Witness) *
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. mfr_signing_key_apple_inc_2026_root"
          value={manufacturerKey}
          onChange={(e) => setManufacturerKey(e.target.value)}
          required
        />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "block" }}>
          Private administrative key used to generate ZK authorization proofs for setting commitments, rotating models, voiding claims, and incrementing epochs. Default keys removed for compliance.
        </span>
      </div>

      {/* Admin Action Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="admin-actions-grid">
        {/* Action 1: Set Manufacturer Authority */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Anchor Authority Commitment
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Circuit 4: <code>setManufacturerCommitment(Uint&lt;32&gt;)</code>
          </p>

          <form onSubmit={handleSetManufacturer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="field-label">Minimum Required Days Policy</label>
              <input
                type="number"
                min="1"
                max="3650"
                className="input-field"
                value={mfrMinDays}
                onChange={(e) => setMfrMinDays(Number(e.target.value))}
                required
              />
            </div>
            <button type="submit" disabled={loadingMfr} className="btn-pill-secondary">
              {loadingMfr ? "Anchoring Authority..." : "Anchor Authority & Policy"}
            </button>
          </form>
        </div>

        {/* Action 2: Reset Product Model */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Rotate Active Product Model
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Circuit 5: <code>resetProduct(Bytes&lt;32&gt;, Uint&lt;32&gt;)</code>
          </p>

          <form onSubmit={handleResetProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="field-label">New Product Model Identifier</label>
              <input
                type="text"
                className="input-field"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loadingReset} className="btn-pill-secondary">
              {loadingReset ? "Updating Model..." : "Rotate Product ID"}
            </button>
          </form>
        </div>

        {/* Action 3: Revoke Fraudulent Warranty */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Revoke / Void Warranty Claim
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Circuit 3: <code>revokeWarranty(Bytes&lt;32&gt;)</code>
          </p>

          <form onSubmit={handleRevokeWarranty} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="field-label">Warranty Commitment to Void</label>
              <input
                type="text"
                className="input-field"
                placeholder="0x..."
                value={revokeCommitment}
                onChange={(e) => setRevokeCommitment(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loadingRevoke} className="btn-pill-secondary" style={{ borderColor: "rgba(244,63,94,0.4)", color: "#f43f5e" }}>
              {loadingRevoke ? "Revoking Claim..." : "Revoke Warranty on Chain"}
            </button>
          </form>
        </div>

        {/* Action 4: Increment Session Epoch */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Increment Anti-Replay Session
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Circuit 6: <code>incrementSession()</code>
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Bumps the monotonic epoch nonce on-chain. Immediately invalidates any customer claims generated under the previous session.
            </p>
          </div>
          <button onClick={handleIncrementSession} disabled={loadingSession} className="btn-pill-secondary" style={{ marginTop: "1rem" }}>
            {loadingSession ? "Incrementing Session..." : "Increment Epoch Nonce"}
          </button>
        </div>
      </div>

      {/* Execution Console */}
      <div className="glass-panel" style={{ marginTop: "2rem", padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" }}>
            Administrative ZK Execution Console
          </span>
          <button onClick={() => setLogs([])} style={{ background: "transparent", border: "none", color: "var(--text-faint)", fontSize: "0.72rem", cursor: "pointer" }}>
            Clear
          </button>
        </div>

        <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "0.9rem", minHeight: "140px", maxHeight: "240px", overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {logs.length === 0 ? (
            <div style={{ color: "var(--text-faint)", fontStyle: "italic" }}>Awaiting administrative action...</div>
          ) : (
            logs.map((l, idx) => (
              <div key={idx} style={{ color: l.type === "success" ? "#10b981" : l.type === "error" ? "#f43f5e" : "#94a3b8" }}>
                {l.msg}
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .admin-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
