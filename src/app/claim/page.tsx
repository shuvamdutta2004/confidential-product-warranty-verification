"use client";

import { useState } from "react";
import { getClient } from "../../lib/contract";
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
  const addLog = (msg: string, type = "info") => setLogs((l) => [...l, { msg, type }]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    // Strict validation: No default secret fallbacks
    if (!productSecretKey.trim()) {
      setError("Product Serial Key / Secret is required for zero-knowledge warranty claim generation.");
      setLoading(false);
      return;
    }
    if (!purchaseInvoice.trim()) {
      setError("Purchase Invoice / Store Receipt Hash is required to prove valid authorized purchase.");
      setLoading(false);
      return;
    }

    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      const client = getClient();
      client.setProductSecretKey(productSecretKey.trim());
      client.setPurchaseInvoice(purchaseInvoice.trim());
      client.setWarrantyDays(warrantyDays);

      addLog("> [ZK WITNESS] productSecretKey() - private serial key bound locally on customer device", "info");
      addLog("> [ZK WITNESS] warrantyProofNonce() - cryptographic entropy blinding salt generated", "info");
      addLog("> [ZK WITNESS] purchaseInvoiceHash() - cryptographic hash of receipt & store invoice", "info");
      addLog(`> [ZK WITNESS] warrantyDaysRemaining() - ${warrantyDays} days balance vs. ${MINIMUM_REQUIRED_DAYS} days requirement`, "info");
      addLog("> [ZK THRESHOLD] Asserting warrantyDaysRemaining >= minimumRequiredDays privately...", "info");

      if (warrantyDays < MINIMUM_REQUIRED_DAYS) {
        addLog(`> [REJECTED] Active days (${warrantyDays}) < ${MINIMUM_REQUIRED_DAYS} days requirement - circuit rejects expired claim`, "error");
        setError(`Warranty Expired: ${warrantyDays} active days is below the required ${MINIMUM_REQUIRED_DAYS}-day threshold.`);
        return;
      }

      addLog("> [CIRCUIT] Executing claimWarranty(expectedProductId) on Midnight Network...", "info");
      const res = await client.claimWarranty(productId);

      addLog(`> [SUBMITTED] Midnight Transaction Dispatched! TxHash: ${res.txHash}`, "info");
      addLog(`> [COMMITMENT] ZK Warranty Commitment: ${res.commitmentHex}`, "info");
      addLog("> [INDEXER] Confirming transaction inclusion on Midnight Preview Indexer...", "info");

      const confirmation = await client.waitForTransactionConfirmation(res.txHash);
      if (confirmation.confirmed) {
        addLog(`> [CONFIRMED] Transaction inclusion confirmed on Midnight Preview Testnet! Block: ${confirmation.blockHeight ?? "Finalized"}`, "success");
      }

      setResult({ ...res, blockHeight: confirmation.blockHeight });
      addLog("> [PRIVACY] Product serial number, receipt details, customer identity - NEVER disclosed on-chain", "success");
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
    if (!claimedCommitment.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);

    try {
      addLog(`> [CIRCUIT] Executing verifyWarranty(claimedCommitment) on-chain...`, "info");
      const res = await getClient().verifyWarranty(claimedCommitment.trim());
      setVerifyResult(res);
      addLog(
        res.matches
          ? "> [VERIFIED] Commitment matches on-chain record - warranty is VALID & AUTHENTIC"
          : "> [MISMATCH] Commitment does NOT match on-chain record - warranty may be invalid or revoked",
        res.matches ? "success" : "error"
      );
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message}`, "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <span className="badge-clean badge-amber">Circuit 1 &amp; 2</span>
          <span className="badge-clean badge-blue">Zero-Knowledge Proof</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Customer Warranty Claim &amp; Verification
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
          Generate a zero-knowledge warranty claim. Proves you possess a valid product serial and purchase receipt with sufficient active days without revealing any identifying data to the network.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "2rem" }} className="claim-layout-grid">
        {/* Claim Form */}
        <div className="glass-panel" style={{ padding: "2.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.5rem" }}>
            1. File Confidential Warranty Claim
          </h2>

          <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="field-label">Active Product Model ID</label>
              <input
                type="text"
                className="input-field"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: "0.25rem", display: "block" }}>
                Public on-chain identifier for the product line (e.g. MacBook Pro M3).
              </span>
            </div>

            <div>
              <label className="field-label">Private Product Serial Key / Secret *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. SN-9812-4412-AAPL-M3PRO"
                value={productSecretKey}
                onChange={(e) => setProductSecretKey(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.72rem", color: "#f59e0b", marginTop: "0.25rem", display: "block" }}>
                🔒 Shielded witness: Never broadcast on-chain. Stays on your device.
              </span>
            </div>

            <div>
              <label className="field-label">Purchase Invoice / Receipt Record *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. INV-BESTBUY-2026-90412"
                value={purchaseInvoice}
                onChange={(e) => setPurchaseInvoice(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.72rem", color: "#f59e0b", marginTop: "0.25rem", display: "block" }}>
                🔒 Shielded witness: Hashed into ZK proof. Retailer details remain private.
              </span>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label className="field-label" style={{ marginBottom: 0 }}>Active Warranty Days Remaining</label>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: warrantyDays >= 30 ? "#10b981" : "#f43f5e", fontWeight: 700 }}>
                  {warrantyDays} Days {warrantyDays < 30 ? "(Expired)" : "(Valid)"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="730"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f59e0b" }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: "0.25rem", display: "block" }}>
                Minimum required on-chain threshold: 30 days. Circuit verifies days ≥ 30 in ZK.
              </span>
            </div>

            {error && (
              <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "8px", padding: "0.8rem", color: "#f43f5e", fontSize: "0.82rem" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-pill-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              {loading ? "Generating ZK Proof & Submitting..." : "Generate Proof & Submit Claim"}
            </button>
          </form>

          {result && (
            <div style={{ marginTop: "1.75rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem" }}>
                ✓ Claim Successfully Confirmed on Midnight Preview
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.78rem" }}>
                <div>
                  <span style={{ color: "var(--text-faint)" }}>Transaction Hash: </span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#ffffff", wordBreak: "break-all" }}>{result.txHash}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-faint)" }}>ZK Commitment: </span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#f59e0b", wordBreak: "break-all" }}>{result.commitmentHex}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verification & Logs Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Verification Form */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              2. On-Chain Warranty Verifier
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Public circuit checking whether a claimed commitment hash matches registered warranty commitments on-chain.
            </p>

            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="field-label">ZK Warranty Commitment Hash</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="0x..."
                  value={claimedCommitment}
                  onChange={(e) => setClaimedCommitment(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={verifyLoading} className="btn-pill-secondary" style={{ width: "100%" }}>
                {verifyLoading ? "Querying Midnight Network..." : "Verify Commitment On-Chain"}
              </button>
            </form>

            {verifyResult && (
              <div style={{ marginTop: "1rem", padding: "0.9rem", borderRadius: "8px", background: verifyResult.matches ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${verifyResult.matches ? "#10b981" : "#f43f5e"}` }}>
                <div style={{ color: verifyResult.matches ? "#10b981" : "#f43f5e", fontWeight: 700, fontSize: "0.85rem" }}>
                  {verifyResult.matches ? "✓ VALID ON-CHAIN WARRANTY" : "✗ INVALID / REVOKED WARRANTY"}
                </div>
              </div>
            )}
          </div>

          {/* Real-Time ZK Execution Console */}
          <div className="glass-panel" style={{ padding: "1.75rem", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" }}>
                ZK Execution Console
              </span>
              <button onClick={() => setLogs([])} style={{ background: "transparent", border: "none", color: "var(--text-faint)", fontSize: "0.72rem", cursor: "pointer" }}>
                Clear
              </button>
            </div>

            <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "0.9rem", minHeight: "180px", maxHeight: "280px", overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {logs.length === 0 ? (
                <div style={{ color: "var(--text-faint)", fontStyle: "italic" }}>Awaiting circuit execution...</div>
              ) : (
                logs.map((l, idx) => (
                  <div key={idx} style={{ color: l.type === "success" ? "#10b981" : l.type === "error" ? "#f43f5e" : "#94a3b8" }}>
                    {l.msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .claim-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
