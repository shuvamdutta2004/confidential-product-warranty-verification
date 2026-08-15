"use client";
import { useState } from "react";
import { getClient } from "../../lib/contract";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default function AdminPage() {
  const [productId, setProductId] = useState("prod_macbook_pro_m3_2027");
  const [resetMinDays, setResetMinDays] = useState(60);
  const [loadingReset, setLoadingReset] = useState(false);

  const [manufacturerKey, setManufacturerKey] = useState("");
  const [mfrMinDays, setMfrMinDays] = useState(30);
  const [loadingMfr, setLoadingMfr] = useState(false);

  const [revokeCommitment, setRevokeCommitment] = useState("");
  const [loadingRevoke, setLoadingRevoke] = useState(false);

  const [loadingSession, setLoadingSession] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const addLog = (msg: string, type = "info") => setLogs(l => [...l, { msg, type }]);
  const isLoading = loadingReset || loadingMfr || loadingRevoke || loadingSession;

  const handleSetManufacturer = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingMfr(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] manufacturerSigningKey() — derived from private key, never disclosed", "info");
      addLog(`> [CIRCUIT] Executing setManufacturerCommitment(Uint<32>) — minimumRequiredDays=${mfrMinDays} days...`, "info");
      const client = getClient();
      client.setManufacturerKey(manufacturerKey || "manufacturer_default_signing_key");
      const res = await client.setManufacturerCommitment(mfrMinDays);
      setResult({ ...res, circuit: "setManufacturerCommitment(Uint<32>)" });
      addLog(`> [SUCCESS] Manufacturer commitment anchored on-chain!`, "success");
      addLog(`> [COMMITMENT] ${res.manufacturerCommitment}`, "success");
      addLog(`> [THRESHOLD] minimumRequiredDays set to ${res.newMinimumDays} days`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingMfr(false); }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingRevoke(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] manufacturerSigningKey() — ZK authorization proof generated locally", "info");
      addLog(`> [CIRCUIT] Executing revokeWarranty(Bytes<32>) — commitment: ${revokeCommitment.substring(0, 20)}...`, "info");
      const res = await getClient().revokeWarranty(revokeCommitment);
      setResult({ ...res, circuit: "revokeWarranty(Bytes<32>)" });
      addLog(`> [SUCCESS] Warranty commitment revoked on-chain!`, "success");
      addLog(`> [REVOKED] ${res.revokedCommitment}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingRevoke(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingReset(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog(`> [CIRCUIT] Executing resetProduct("${productId}", ${resetMinDays} days)...`, "info");
      const res = await getClient().resetProduct(productId, resetMinDays);
      setResult({ ...res, circuit: "resetProduct(Bytes<32>, Uint<32>)" });
      addLog(`> [SUCCESS] Product model updated! New Product ID: ${res.newProductId}`, "success");
      addLog(`> [THRESHOLD] minimumRequiredDays updated to ${res.newMinimumDays} days`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingReset(false); }
  };

  const handleIncrement = async () => {
    setLoadingSession(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [CIRCUIT] Executing incrementSession() — invalidating stale proofs...", "info");
      const res = await getClient().incrementSession();
      setResult({ ...res, circuit: "incrementSession()" });
      addLog(`> [SUCCESS] Session incremented! TxHash: ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingSession(false); }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-amber">Manufacturer Console</span>
            <span className="badge badge-purple">Issuer Authority</span>
            <span className="badge badge-cyan">Midnight Preview</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "1.75rem" }}>Manufacturer Admin Console</h1>
          <p className="section-desc">
            Admin circuits require the manufacturer's private signing key as a ZK witness for authorization. The key is never transmitted — only the derived commitment is verified on-chain.
          </p>
        </div>

        {/* ── Circuit Reference ── */}
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Manufacturer Admin Circuits</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {[
              { circuit: "setManufacturerCommitment(Uint<32>)", desc: "Anchor manufacturer authority + set required days", color: "#8b5cf6" },
              { circuit: "revokeWarranty(Bytes<32>)", desc: "Revoke a fraudulent warranty claim (ZK auth)", color: "#ef4444" },
              { circuit: "resetProduct(Bytes<32>, Uint<32>)", desc: "Reset product ID + minimum days threshold", color: "#f59e0b" },
              { circuit: "incrementSession()", desc: "Bump session nonce (replay protection)", color: "#06b6d4" },
            ].map(c => (
              <div key={c.circuit} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.75rem", border: `1px solid ${c.color}33` }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: c.color, marginBottom: "0.25rem" }}>{c.circuit}</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panel 1: Set Manufacturer Commitment ── */}
        <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem", borderLeft: "3px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "1rem" }}>
            🔑 Panel 1 — setManufacturerCommitment(Uint&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Anchors the manufacturer's public commitment on-chain and sets the minimum active warranty days requirement for valid claims.
          </p>
          <form onSubmit={handleSetManufacturer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                Manufacturer Private Signing Key (ZK Witness — manufacturerSigningKey())
              </label>
              <input type="password" id="manufacturerKey" value={manufacturerKey} onChange={e => setManufacturerKey(e.target.value)}
                placeholder="Manufacturer private signing key (never transmitted)" autoComplete="off" />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                Minimum Required Active Warranty Days: <span style={{ color: "#8b5cf6" }}>{mfrMinDays} days</span>
              </label>
              <input type="range" min={0} max={365} step={5} value={mfrMinDays}
                onChange={e => setMfrMinDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8b5cf6" }} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} id="setMfrBtn"
              style={{ background: "rgba(139,92,246,0.2)", borderColor: "rgba(139,92,246,0.5)" }}>
              {loadingMfr ? <><span className="spinner" /> Anchoring...</> : "Set Manufacturer Commitment (ZK)"}
            </button>
          </form>
        </div>

        {/* ── Panel 2: Revoke Warranty ── */}
        <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem", borderLeft: "3px solid #ef4444" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem" }}>
            🚫 Panel 2 — revokeWarranty(Bytes&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Revoke or void a specific fraudulent warranty commitment. Requires manufacturer authority proof via <code>manufacturerSigningKey()</code> ZK witness. Stored in <code>lastRevokedCommitment</code>.
          </p>
          <form onSubmit={handleRevoke} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                Warranty Commitment Hash to Revoke (Bytes&lt;32&gt;)
              </label>
              <input type="text" id="revokeCommitment" value={revokeCommitment}
                onChange={e => setRevokeCommitment(e.target.value)}
                placeholder="0x... warranty commitment hash to revoke" required />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading || !revokeCommitment} id="revokeBtn"
              style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)" }}>
              {loadingRevoke ? <><span className="spinner" /> Revoking...</> : "Revoke Warranty Claim (ZK Auth)"}
            </button>
          </form>
        </div>

        {/* ── Panel 3: Reset Product ── */}
        <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b", marginBottom: "1rem" }}>
            🔄 Panel 3 — resetProduct(Bytes&lt;32&gt;, Uint&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Update the active product model ID and adjust minimum active warranty days requirement for new model releases.
          </p>
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                New Product Model ID (Bytes&lt;32&gt;)
              </label>
              <input type="text" id="newProductId" value={productId} onChange={e => setProductId(e.target.value)}
                placeholder="prod_macbook_pro_m3_2027" />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                New Minimum Active Days Threshold: <span style={{ color: "#f59e0b" }}>{resetMinDays} days</span>
              </label>
              <input type="range" min={0} max={365} step={5} value={resetMinDays}
                onChange={e => setResetMinDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f59e0b" }} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} id="resetBtn"
              style={{ background: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.4)" }}>
              {loadingReset ? <><span className="spinner" /> Resetting...</> : "Reset Product & Threshold"}
            </button>
          </form>
        </div>

        {/* ── Panel 4: Increment Session ── */}
        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.25rem", borderLeft: "3px solid #06b6d4" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#06b6d4", marginBottom: "0.75rem" }}>
            🔒 Panel 4 — incrementSession()
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Bumps the <code>activeSession</code> nonce to invalidate stale proofs from previous epochs.
          </p>
          <button onClick={handleIncrement} className="btn-secondary" disabled={isLoading} id="sessionBtn">
            {loadingSession ? <><span className="spinner" /> Bumping Session...</> : "Increment Session Nonce"}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Log</div>
            <div className="log-box">
              {logs.map((l, i) => <div key={i} className={`log-${l.type}`}>{l.msg}</div>)}
            </div>
          </div>
        )}

        {result && (
          <div className="glass-card fade-in" style={{ padding: "1.5rem", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.05)" }}>
            <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem" }}>✅ Transaction Confirmed</p>
            {Object.entries(result).map(([k, v]) => v !== undefined && (
              <div key={k} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 160 }}>{k}:</span>
                <span style={{ fontSize: "0.8rem", color: "#f1f5f9", fontFamily: "monospace", wordBreak: "break-all" }}>{String(v)}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <Link href="/" className="btn-secondary">Back to Dashboard</Link>
              <Link href="/explorer" className="btn-secondary">View on Explorer</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

