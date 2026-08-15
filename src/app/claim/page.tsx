"use client";
import { useState } from "react";
import { getClient } from "../../lib/contract";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default function ClaimPage() {
  const [productId, setProductId] = useState("prod_macbook_pro_m3_2026");
  const [productSecretKey, setProductSecretKey] = useState("");
  const [purchaseInvoice, setPurchaseInvoice] = useState("");
  const [warrantyDays, setWarrantyDays] = useState(180);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [claimedCommitment, setClaimedCommitment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const MINIMUM_REQUIRED_DAYS = 30;
  const addLog = (msg: string, type = "info") => setLogs(l => [...l, { msg, type }]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null); setLogs([]);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      const client = getClient();
      client.setProductSecretKey(productSecretKey || "serial_secret_macbook_pro_2026");
      client.setPurchaseInvoice(purchaseInvoice || "invoice_receipt_store_09182");
      client.setWarrantyDays(warrantyDays);

      addLog("> [ZK WITNESS] productSecretKey() — private serial key generated locally", "info");
      addLog("> [ZK WITNESS] warrantyProofNonce() — random entropy salt for replay protection", "info");
      addLog("> [ZK WITNESS] purchaseInvoiceHash() — SHA-256 hash of receipt & invoice", "info");
      addLog(`> [ZK WITNESS] warrantyDaysRemaining() — ${warrantyDays} days balance vs. ${MINIMUM_REQUIRED_DAYS} days requirement`, "info");
      addLog(`> [ZK THRESHOLD] Asserting warrantyDaysRemaining >= minimumRequiredDays privately...`, "info");

      if (warrantyDays < MINIMUM_REQUIRED_DAYS) {
        addLog(`> [REJECTED] ${warrantyDays} active days < ${MINIMUM_REQUIRED_DAYS} days requirement — circuit would reject proof`, "error");
        setError(`Warranty Expired: ${warrantyDays} active days is below the required ${MINIMUM_REQUIRED_DAYS}-day threshold.`);
        return;
      }

      addLog("> [CIRCUIT] Executing claimWarranty(Bytes<32>) on Midnight Network...", "info");
      const res = await client.claimWarranty(productId);
      setResult(res);
      addLog(`> [SUCCESS] Warranty claim verified & signed! TxHash: ${res.txHash}`, "success");
      addLog(`> [COMMITMENT] ZK Warranty Commitment: ${res.commitmentHex}`, "success");
      addLog(`> [PRIVACY] Product serial number, receipt details, customer identity — NEVER disclosed on-chain`, "success");
      addLog(`> [FEE] Transaction fee: ${res.txFee} ${res.txFeeAsset}`, "info");
    } catch (err: any) {
      const msg = err?.message || "Warranty claim failed.";
      setError(msg);
      addLog(`> [ERROR] ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true); setVerifyResult(null);
    try {
      addLog("> [CIRCUIT] Executing verifyWarranty(Bytes<32>) on-chain...", "info");
      const res = await getClient().verifyWarranty(claimedCommitment);
      setVerifyResult(res);
      addLog(res.matches
        ? "> [VERIFIED] Commitment matches on-chain record — warranty is VALID"
        : "> [MISMATCH] Commitment does NOT match — warranty may be invalid or revoked",
        res.matches ? "success" : "error");
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message}`, "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-amber">ZK Warranty Claim</span>
            <span className="badge badge-purple">Midnight Preview</span>
            <span className="badge badge-green">Coverage Assertion</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "1.75rem" }}>File Warranty Claim Anonymously</h1>
          <p className="section-desc">
            Your serial number, store receipt, and customer identity stay fully private. A zero-knowledge proof verifies your remaining warranty coverage meets the required threshold — only a cryptographic commitment is disclosed on-chain.
          </p>
        </div>

        {/* ── ZK Witnesses Card ── */}
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ZK Circuit Architecture — claimWarranty(Bytes&lt;32&gt;)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "productSecretKey()", desc: "Private serial secret key", color: "#e11d48" },
              { label: "warrantyProofNonce()", desc: "Entropy/replay binding", color: "#f59e0b" },
              { label: "purchaseInvoiceHash()", desc: "Hashed receipt & invoice", color: "#06b6d4" },
              { label: "warrantyDaysRemaining()", desc: "Private active days ≥ 30", color: "#10b981" },
            ].map(w => (
              <div key={w.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.75rem", border: `1px solid ${w.color}33` }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: w.color, marginBottom: "0.25rem" }}>{w.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Claim Form ── */}
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
          <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Product Model Identifier (Bytes&lt;32&gt;) *
              </label>
              <input type="text" id="productId" value={productId} onChange={e => setProductId(e.target.value)}
                placeholder="prod_macbook_pro_m3_2026" required />
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>Must match active product model ID on Midnight chain</p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Product Serial Secret Key — Private Witness
              </label>
              <input type="password" id="productSecretKey" value={productSecretKey} onChange={e => setProductSecretKey(e.target.value)}
                placeholder="Your product private serial key (never transmitted)" autoComplete="off" />
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                Calculated locally to generate <code>productSecretKey()</code> ZK witness — never sent over network
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Active Warranty Coverage Days — Private Threshold Witness
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input type="range" id="warrantyDays" min={0} max={730} step={15} value={warrantyDays}
                  onChange={e => setWarrantyDays(Number(e.target.value))}
                  style={{ flex: 1, accentColor: warrantyDays >= MINIMUM_REQUIRED_DAYS ? "#10b981" : "#ef4444" }} />
                <span style={{
                  fontFamily: "monospace", fontWeight: 700, fontSize: "1rem",
                  color: warrantyDays >= MINIMUM_REQUIRED_DAYS ? "#10b981" : "#ef4444", minWidth: "5rem"
                }}>{warrantyDays} days</span>
                <span style={{
                  fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "99px",
                  background: warrantyDays >= MINIMUM_REQUIRED_DAYS ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  color: warrantyDays >= MINIMUM_REQUIRED_DAYS ? "#10b981" : "#ef4444"
                }}>
                  {warrantyDays >= MINIMUM_REQUIRED_DAYS ? "✅ ACTIVE" : "❌ EXPIRED"}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                Compared privately via <code>warrantyDaysRemaining()</code> vs. on-chain <code>minimumRequiredDays</code> (30 days) — balance never disclosed
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Purchase Receipt & Invoice Record
              </label>
              <textarea id="purchaseInvoice" value={purchaseInvoice} onChange={e => setPurchaseInvoice(e.target.value)}
                placeholder="Paste store invoice/receipt payload (hashed locally via purchaseInvoiceHash() before ZK proof)"
                rows={3} style={{ resize: "vertical" }} />
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                Content is hashed locally — only SHA-256 hash enters <code>purchaseInvoiceHash()</code> ZK proof
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button type="submit" className="btn-primary" disabled={loading} id="claimBtn">
                {loading ? <><span className="spinner" /> Generating ZK Proof...</> : "File Warranty Claim (ZK Proof)"}
              </button>
              <Link href="/" className="btn-secondary">Back to Dashboard</Link>
            </div>
          </form>
        </div>

        {/* ── Logs ── */}
        {logs.length > 0 && (
          <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Log</div>
            <div className="log-box">
              {logs.map((l, i) => <div key={i} className={`log-${l.type}`}>{l.msg}</div>)}
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card fade-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <p style={{ color: "#fca5a5", fontWeight: 600 }}>Error</p>
            <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "0.9rem" }}>{error}</p>
          </div>
        )}

        {result && (
          <div className="glass-card fade-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.05)" }}>
            <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem" }}>✅ Warranty Claim Verified & Confirmed On-Chain!</p>
            {[
              { label: "Circuit", value: "claimWarranty(Bytes<32>)" },
              { label: "ZK Claim Commitment", value: result.commitmentHex },
              { label: "On-Chain TxHash", value: result.txHash },
              { label: "Days Requirement Met", value: result.daysRequirementMet ? "✅ Satisfied (private)" : "❌ Not Satisfied" },
              { label: "Signed By", value: result.signedBy },
              { label: "Tx Fee", value: `${result.txFee} ${result.txFeeAsset}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 160 }}>{label}:</span>
                <span style={{ fontSize: "0.8rem", color: "#f1f5f9", fontFamily: "monospace", wordBreak: "break-all" }}>{value as string}</span>
              </div>
            ))}
            <p style={{ fontSize: "0.8rem", color: "#10b981", marginTop: "0.75rem", fontWeight: 600 }}>Status: CONFIRMED (Midnight Preview)</p>
          </div>
        )}

        {/* ── Verify Claim Panel ── */}
        <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "3px solid #06b6d4" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#06b6d4", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Verify Warranty Claim — verifyWarranty(Bytes&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Repair centers and customers can publicly verify whether a claimed commitment matches the registered warranty claim on-chain.
          </p>
          <form onSubmit={handleVerify} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input type="text" id="claimedCommitment" value={claimedCommitment}
              onChange={e => setClaimedCommitment(e.target.value)}
              placeholder="0x... claimed warranty commitment hash"
              style={{ flex: 1, minWidth: "200px" }} />
            <button type="submit" className="btn-secondary" disabled={verifyLoading} id="verifyBtn" style={{ whiteSpace: "nowrap" }}>
              {verifyLoading ? <><span className="spinner" /> Verifying...</> : "Verify On-Chain"}
            </button>
          </form>
          {verifyResult && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "8px",
              background: verifyResult.matches ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${verifyResult.matches ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <p style={{ color: verifyResult.matches ? "#6ee7b7" : "#fca5a5", fontWeight: 700, marginBottom: "0.5rem" }}>
                {verifyResult.matches ? "✅ VALID — Warranty Commitment Verified On-Chain" : "❌ INVALID — Commitment Mismatch"}
              </p>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>TxHash: <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{verifyResult.txHash}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

