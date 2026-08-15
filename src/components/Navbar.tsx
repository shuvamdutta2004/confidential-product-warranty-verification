"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConnectWallet = async () => {
    if (connecting) return;
    setConnecting(true);
    setErrorMsg("");

    try {
      const win = typeof window !== "undefined" ? (window as any) : {};
      const midnight = win.midnight;
      const connector = midnight?.mnLace || midnight?.lace || win.cardano?.lace;

      if (!connector || typeof connector.enable !== "function") {
        setErrorMsg("Midnight Lace Extension not found. Please install extension.");
        alert("Midnight Lace Extension not detected in your browser. Please install or enable Midnight Lace extension.");
        return;
      }

      // Triggers browser extension popup window for explicit user approval
      const api = await connector.enable();

      if (!api) {
        setErrorMsg("Connection rejected by user.");
        return;
      }

      let addr = "";
      if (typeof api.state === "function") {
        const st = await api.state();
        addr = st?.address || st?.account?.address || "";
      }
      if (!addr && typeof api.getAccount === "function") {
        addr = await api.getAccount();
      }
      if (!addr && typeof api.accounts === "function") {
        const accs = await api.accounts();
        addr = Array.isArray(accs) ? accs[0] : accs;
      }

      const finalAddr = String(addr || "0x1AM...ApprovedWallet");
      const formatted = finalAddr.length > 14 ? `${finalAddr.substring(0, 6)}...${finalAddr.substring(finalAddr.length - 4)}` : finalAddr;

      setWalletConnected(true);
      setWalletAddress(formatted);
    } catch (e: any) {
      console.warn("Wallet approval error or cancellation:", e);
      setErrorMsg(e?.message || "Wallet approval cancelled");
      setWalletConnected(false);
      setWalletAddress("");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setErrorMsg("");
  };

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <span>🛡️</span> CPWV — Midnight ZK
      </Link>
      <div className="nav-links">
        <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>Dashboard</Link>
        <Link href="/claim" className={`nav-link ${pathname === "/claim" ? "active" : ""}`}>Claim & Verify</Link>
        <Link href="/admin" className={`nav-link ${pathname === "/admin" ? "active" : ""}`}>Manufacturer Console</Link>
        <Link href="/explorer" className={`nav-link ${pathname === "/explorer" ? "active" : ""}`}>Explorer</Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {walletConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              fontSize: "0.78rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
              color: "#10b981", padding: "0.3rem 0.75rem", borderRadius: "99px", fontWeight: 600
            }}>
              🟢 {walletAddress}
            </span>
            <button onClick={handleDisconnect} className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
              Disconnect
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <button onClick={handleConnectWallet} disabled={connecting} className="btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}>
              {connecting ? <><span className="spinner" /> Approving in Extension...</> : <><span>👛</span> Connect Wallet</>}
            </button>
            {errorMsg && <span style={{ fontSize: "0.7rem", color: "#fca5a5", marginTop: "0.25rem" }}>{errorMsg}</span>}
          </div>
        )}
      </div>
    </header>
  );
}
