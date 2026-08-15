"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ walletAddress, onConnect, onDisconnect, connecting }: {
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}) {
  const pathname = usePathname();
  const short = walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.slice(-6)}` : null;

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <span>🛡️</span> CPWV — Midnight ZK
      </Link>
      <div className="nav-links">
        <Link href="/"        className={`nav-link ${pathname === "/"        ? "active" : ""}`}>Dashboard</Link>
        <Link href="/claim"   className={`nav-link ${pathname === "/claim"   ? "active" : ""}`}>Claim & Verify</Link>
        <Link href="/admin"   className={`nav-link ${pathname === "/admin"   ? "active" : ""}`}>Manufacturer Console</Link>
        <Link href="/explorer" className={`nav-link ${pathname === "/explorer" ? "active" : ""}`}>Explorer</Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {walletAddress ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", padding: "0.35rem 0.9rem", borderRadius: "99px", fontWeight: 700 }}>
              🟢 {short}
            </span>
            <button onClick={onDisconnect} className="btn-secondary" style={{ padding: "0.35rem 0.9rem", fontSize: "0.78rem" }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button id="connect-wallet-btn" onClick={onConnect} disabled={connecting} className="btn-primary" style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem" }}>
            {connecting ? <><span className="spinner" /> Connecting...</> : <>👛 Connect Wallet</>}
          </button>
        )}
      </div>
    </header>
  );
}
