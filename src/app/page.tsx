"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { CANONICAL_DEPLOYMENT } from "../lib/contract";

const WarrantyRefractionRing3D = dynamic(
  () => import("../components/WarrantyRefractionRing3D"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          minHeight: "540px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.2)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.85rem",
        }}
      >
        Initializing 3D WebGL Engine...
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Subtle ambient light glow */}
      <div className="ambient-glow" />

      {/* Vertical 'SCROLL' Indicator on left border (matching screenshot) */}
      <div className="scroll-indicator-side">SCROLL</div>

      {/* Main Hero Container */}
      <section className="hero-container">
        <div className="hero-grid">
          {/* Left Column: Hero Typography & Actions */}
          <div>
            {/* Status Pill matching screenshot */}
            <div className="status-pill">
              <span className="pulse-dot" />
              <span>Zero-Knowledge Product Warranty on Midnight Network</span>
            </div>

            {/* Giant Clean Headline */}
            <h1 className="hero-title">
              Confidential, Verifiable &amp; Tamper-Proof Product Warranty
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              Our zero-knowledge smart contract verifies warranty validity, purchase timestamps,
              and serial claims on Midnight Network without exposing customer invoices or private product secrets.
            </p>

            {/* Action Buttons (Solid White Pill + Outline Play Pill) */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/claim" className="btn-pill-primary">
                File Warranty Claim
              </Link>
              <Link href="/claim" className="btn-pill-secondary">
                <span style={{ fontSize: "0.85rem" }}>▶</span>
                Verify On-Chain
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Refraction Ring (WebGL Three.js) */}
          <div style={{ position: "relative", width: "100%", minHeight: "540px" }}>
            <WarrantyRefractionRing3D />
          </div>
        </div>

        {/* Bottom Stats Row (matching screenshot numbers & typography) */}
        <div className="hero-stats-row">
          <div className="stat-item">
            <div className="stat-num">$198.4M+</div>
            <div className="stat-desc">Total Product Value Protected</div>
          </div>

          <div className="stat-item">
            <div className="stat-num">97.6K+</div>
            <div className="stat-desc">Confidential Claims Filed</div>
          </div>

          <div className="stat-item">
            <div className="stat-num">149.2K+</div>
            <div className="stat-desc">ZK Proofs Verified On Preview</div>
          </div>

          <div style={{ marginLeft: "auto", display: "none" }} className="scroll-down-hint">
            <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
              Scroll Down ↘
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: ZK Smart Contract Architecture & Security Features */}
      <section style={{ maxWidth: 1380, margin: "0 auto", padding: "5rem 2.5rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
            <span className="badge-clean badge-amber">Compact v0.23</span>
            <span className="badge-clean badge-blue">Midnight Preview Testnet</span>
            <span className="badge-clean badge-emerald">6 Provable Circuits</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            ZK Smart Contract Circuits
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
            Formal verification rules compiled from <code style={{ fontFamily: "var(--font-mono)", color: "#f59e0b" }}>contracts/confidential_product_warranty.compact</code>
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {[
            {
              circuit: "claimWarranty(expectedProductId)",
              type: "ZK Proof Circuit",
              desc: "Privately asserts active warranty days >= threshold, derives cryptographic credential binding, and generates on-chain nullifier.",
              badge: "Private Days Threshold",
              color: "#f59e0b",
            },
            {
              circuit: "verifyWarranty(claimedCommitment)",
              type: "Public Verification Circuit",
              desc: "On-chain evaluation confirming whether a customer commitment matches active registered warranty commitments.",
              badge: "Public Consensus",
              color: "#38bdf8",
            },
            {
              circuit: "revokeWarranty(commitmentToRevoke)",
              type: "Authorized Admin Circuit",
              desc: "Revokes voided or fraudulent warranty claims. Strictly requires authorized manufacturer signing key.",
              badge: "Manufacturer ZK Auth",
              color: "#f43f5e",
            },
            {
              circuit: "setManufacturerCommitment(newMinimumDays)",
              type: "Authority Setup Circuit",
              desc: "Anchors root manufacturer authority commitment and defines minimum active coverage days required.",
              badge: "One-Time Initialization",
              color: "#10b981",
            },
            {
              circuit: "resetProduct(newProductId, newMinimumDays)",
              type: "Authorized Admin Circuit",
              desc: "Updates active product model ID and adjusts policy duration. Authorized via manufacturerSigningKey witness.",
              badge: "Model Rotation",
              color: "#a855f7",
            },
            {
              circuit: "incrementSession()",
              type: "Epoch Invalidation Circuit",
              desc: "Monotonically increments anti-replay epoch nonce, invalidating stale customer proofs.",
              badge: "Anti-Replay Protection",
              color: "#64748b",
            },
          ].map((c) => (
            <div key={c.circuit} className="glass-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                  {c.type}
                </span>
                <span className="badge-clean" style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}35` }}>
                  {c.badge}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.92rem", fontWeight: 600, color: "#ffffff", marginBottom: "0.75rem" }}>
                {c.circuit}
              </div>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Privacy Isolation Matrix */}
      <section style={{ maxWidth: 1380, margin: "0 auto", padding: "0 2.5rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="privacy-matrix-grid">
          {/* Private Witnesses (Left) */}
          <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid #f59e0b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b" }}>
                Shielded Private Witnesses (Customer Device Only)
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { name: "productSecretKey()", desc: "Private customer product serial salt. Never revealed to public." },
                { name: "purchaseInvoiceHash()", desc: "SHA-256 hash of purchase invoice, receipt, and retailer." },
                { name: "warrantyDaysRemaining()", desc: "Actual private days balance verified against threshold." },
                { name: "warrantyProofNonce()", desc: "Cryptographic entropy blinding salt preventing correlation." },
                { name: "manufacturerSigningKey()", desc: "Manufacturer private key for administrative circuit calls." },
              ].map((w) => (
                <div key={w.name} style={{ padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#ffffff", fontWeight: 600 }}>
                    {w.name}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {w.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On-Chain Public Ledger (Right) */}
          <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid #38bdf8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#38bdf8" }}>
                On-Chain Public Ledger (Midnight Preview Network)
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { name: "claimCount: Counter", desc: "Total verified confidential warranty claims recorded." },
                { name: "revokedCount: Counter", desc: "Total voided or fraudulent claims revoked by manufacturer." },
                { name: "activeSession: Counter", desc: "Monotonic epoch nonce bound into each claim for anti-replay." },
                { name: "productId: Bytes<32>", desc: "Active product model identifier anchored by manufacturer." },
                { name: "lastClaimCommitment: Bytes<32>", desc: "Most recent ZK warranty commitment hash written on-chain." },
              ].map((l) => (
                <div key={l.name} style={{ padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#38bdf8", fontWeight: 600 }}>
                    {l.name}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {l.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Canonical Deployment Record */}
      <section style={{ maxWidth: 1380, margin: "0 auto", padding: "0 2.5rem 6rem" }}>
        <div className="glass-panel" style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                Verified On-Chain Deployment
              </div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "#ffffff", marginTop: "0.25rem" }}>
                Midnight Preview Testnet Canonical Contract
              </h3>
            </div>
            <a
              href={CANONICAL_DEPLOYMENT.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-cta-pill"
            >
              Open Midnight Explorer ↗
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Contract Address</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#ffffff", wordBreak: "break-all" }}>
                {CANONICAL_DEPLOYMENT.contractAddress}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Deployment TxHash</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#f59e0b", wordBreak: "break-all" }}>
                {CANONICAL_DEPLOYMENT.txHash}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Compiler &amp; Commit</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#38bdf8" }}>
                Compact v{CANONICAL_DEPLOYMENT.compilerVersion} ({CANONICAL_DEPLOYMENT.sourceCommit})
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (min-width: 1024px) {
          .scroll-down-hint {
            display: block !important;
          }
        }
        @media (max-width: 860px) {
          .privacy-matrix-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
