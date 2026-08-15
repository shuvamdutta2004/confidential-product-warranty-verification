"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);

  const findConnector = () => {
    const win = (typeof window !== "undefined" ? window : {}) as any;
    // Try all known Midnight Lace / 1AM injection points
    return (
      win?.midnight?.mnLace ??
      win?.mnLace ??
      win?.midnight ??
      win?.cardano?.midnight ??
      null
    );
  };

  const handleConnectWallet = async () => {
    if (connecting) return;
    setConnecting(true);

    // Give the extension a moment to inject if page just loaded
    await new Promise((r) => setTimeout(r, 300));

    const connector = findConnector();

    if (!connector || typeof connector.enable !== "function") {
      alert(
        "Midnight Lace / 1AM extension not detected.\n\n" +
        "Please make sure:\n" +
        "1. Extension is installed and enabled\n" +
        "2. You are on a site the extension is allowed to access\n" +
        "3. Try refreshing the page and click again"
      );
      setConnecting(false);
      return;
    }

    try {
      // This opens the extension approval popup
      const api = await connector.enable();

      let addr = "";
      if (api) {
        if (typeof api.state === "function") {
          try {
            const st = await api.state();
            addr = st?.address ?? st?.wallet?.address ?? st?.account?.address ?? "";
          } catch (_) {}
        }
        if (!addr && typeof api.getAccount === "function") {
          try { addr = await api.getAccount(); } catch (_) {}
        }
        if (!addr && typeof api.accounts === "function") {
          try {
            const accs = await api.accounts();
            addr = Array.isArray(accs) ? accs[0] : String(accs ?? "");
          } catch (_) {}
        }
      }

      const finalAddr = String(addr || "Midnight Wallet");
      const display =
        finalAddr.length > 16
          ? `${finalAddr.slice(0, 6)}...${finalAddr.slice(-4)}`
          : finalAddr;

      setWalletConnected(true);
      setWalletAddress(display);
    } catch (e: any) {
      const msg = String(e?.message ?? "").toLowerCase();
      if (!msg.includes("cancel") && !msg.includes("reject") && !msg.includes("denied")) {
        alert("Connection error: " + (e?.message ?? "Unknown error"));
      }
      // User cancelled — do nothing, just reset
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress("");
  };

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <span>🛡️</span> CPWV — Midnight ZK
      </Link>
      <div className="nav-links">
        <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>Dashboard</Link>
        <Link href="/claim" className={`nav-link ${pathname === "/claim" ? "active" : ""}`}>Claim &amp; Verify</Link>
        <Link href="/admin" className={`nav-link ${pathname === "/admin" ? "active" : ""}`}>Manufacturer Console</Link>
        <Link href="/explorer" className={`nav-link ${pathname === "/explorer" ? "active" : ""}`}>Explorer</Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {walletConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              fontSize: "0.8rem",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.4)",
              color: "#10b981",
              padding: "0.35rem 0.9rem",
              borderRadius: "99px",
              fontWeight: 700,
            }}>
              🟢 {walletAddress}
            </span>
            <button onClick={handleDisconnect} className="btn-secondary"
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.78rem" }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button
            id="connect-wallet-btn"
            onClick={handleConnectWallet}
            disabled={connecting}
            className="btn-primary"
            style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem" }}
          >
            {connecting
              ? <><span className="spinner" /> Waiting for approval...</>
              : <><span>👛</span> Connect Wallet</>
            }
          </button>
        )}
      </div>
    </header>
  );
}
