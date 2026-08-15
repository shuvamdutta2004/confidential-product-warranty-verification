import Navbar from '../components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confidential Product Warranty Verification | ZK dApp on Midnight',
  description: 'Prove product warranty coverage and file claims without exposing serial numbers, store receipts, purchase dates, or customer identity. ZK smart contracts on Midnight Network.',
};

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* -- Hero -- */}
        <div className="hero">
          <div className="hero-badge">
            <span>???</span> Midnight Preview Network — Live dApp
          </div>
          <h1>Confidential Product Warranty Verification</h1>
          <p>
            Prove product warranty coverage, authenticate items, and file claims with <strong>zero-knowledge proofs</strong> — without revealing your product serial numbers, store receipts, purchase dates, or identity on-chain.
          </p>
          <div className="hero-actions">
            <Link href="/claim" className="btn-primary">?? File Warranty Claim (ZK Proof)</Link>
            <Link href="/admin" className="btn-secondary">?? Manufacturer Console</Link>
          </div>
        </div>

        {/* -- Stats Grid -- */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            {[
              { value: '6', label: 'ZK Circuits', color: '#e11d48' },
              { value: '8', label: 'Ledger Fields', color: '#8b5cf6' },
              { value: '5', label: 'Private Witnesses', color: '#10b981' },
              { value: '10', label: 'Unit Tests Passing', color: '#f59e0b' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* -- ZK Contract Architecture -- */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-amber">Compact v0.23</span>
                <span className="badge badge-purple">Midnight Preview</span>
                <span className="badge badge-green">6 Circuits</span>
              </div>
              <h2 className="section-title">ZK Warranty Contract Architecture (v2)</h2>
              <p className="section-desc">contracts/confidential_product_warranty.compact — 8 ledger fields, 5 witnesses, 6 circuits</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {[
                { circuit: 'claimWarranty(Bytes<32>)', witnesses: '4 witnesses', desc: 'ZK warranty claim with private active days assertion', color: '#e11d48' },
                { circuit: 'verifyWarranty(Bytes<32>)', witnesses: '0 witnesses', desc: 'Public on-chain claim commitment verification', color: '#06b6d4' },
                { circuit: 'revokeWarranty(Bytes<32>)', witnesses: 'manufacturerSigningKey', desc: 'Manufacturer revokes fraudulent claim (ZK auth)', color: '#ef4444' },
                { circuit: 'setManufacturerCommitment(Uint<32>)', witnesses: 'manufacturerSigningKey', desc: 'Anchor manufacturer authority + set required days', color: '#f59e0b' },
                { circuit: 'resetProduct(Bytes<32>, Uint<32>)', witnesses: '—', desc: 'Rotate product model ID + update days requirement', color: '#10b981' },
                { circuit: 'incrementSession()', witnesses: '—', desc: 'Bump session nonce for replay protection', color: '#64748b' },
              ].map(c => (
                <div key={c.circuit} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: '10px', padding: '1rem', border: `1px solid ${c.color}33` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: c.color, marginBottom: '0.35rem', fontWeight: 700 }}>{c.circuit}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem' }}>Witnesses: {c.witnesses}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* -- Privacy Model Matrix -- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>? Never Disclosed (Private Witnesses)</div>
              {['productSecretKey() — Customer private product serial key', 'purchaseInvoiceHash() — Hashed store receipt & invoice', 'warrantyDaysRemaining() — Private active warranty days balance', 'warrantyProofNonce() — Entropy salt for replay resistance', 'manufacturerSigningKey() — Manufacturer private key'].map(w => (
                <div key={w} style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>{w}</div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>? Public Ledger (8 Fields)</div>
              {['claimCount — Total verified warranty claims', 'revokedCount — Total revoked/voided warranties', 'productId — Active product model identifier', 'lastClaimCommitment — Most recent ZK warranty hash', 'manufacturerCommitment — Authority anchor', 'minimumRequiredDays — Minimum active days requirement', 'activeSession — Epoch nonce (replay protection)', 'lastRevokedCommitment — Most recent revoked hash'].map(f => (
                <div key={f} style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>{f}</div>
              ))}
            </div>
          </div>

          {/* -- Action Links -- */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="https://explorer.preview.midnight.network/contracts/0x8f2a10b49c716382046175c04251c305868219682427253c06a6f538fab09a2e"
                target="_blank" rel="noopener noreferrer" className="btn-secondary">
                ?? Midnight Explorer
              </a>
              <a href="https://github.com/shuvamdutta2004/confidential-product-warranty-verification" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                ?? GitHub Repo
              </a>
              <Link href="/claim" className="btn-primary">? File Warranty Claim</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

