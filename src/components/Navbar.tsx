"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// Midnight Lace / 1AM extension API detection
async function detectMidnightExtension(): Promise<any | null> {
  const win = typeof window !== "undefined" ? (window as any) : null;
  if (!win) return null;

  // Wait up to 2s for extension to inject
  for (let i = 0; i < 10; i++) {
    const connector =
      win?.midnight?.mnLace ??
      win?.mnLace ??
      win?.midnight ??
      null;

    if (connector && typeof connector.enable === "function") {
      return connector;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [extensionAvailable, setExtensionAvailable] = useState<boolean | null>(null);

  // Probe for extension on mount
  useEffect(() => {
    detectMidnightExtension().then((c) => {
      setExtensionAvailable(!!c);
    });
  }, []);

  const handleConnectWallet = async () => {
    if (connecting) return;
    setConnecting(true);

    try {
      const connector = await detectMidnightExtension();

      if (!connector) {
        setConnecting(false);
        setExtensionAvailable(false);
        return;
      }

      // Trigger extension approval popup — waits for user action
      const api = await connector.enable();

      let addr: string = "";

      try {
        // Different API versions
        if (api?.state) {
          const st = await api.state();
          addr = st?.address || st?.wallet?.address || st?.account?.address || "";
        }
        if (!addr && api?.getAccount) addr = await api.getAccount();
        if (!addr && api?.accounts) {
          const accs = await api.accounts();
          addr = Array.isArray(accs) ? accs[0] : accs;
        }
      } catch (_) {}

      const finalAddr = String(addr || "Midnight Wallet");
      const formatted =
        finalAddr.length > 16
          ? `${finalAddr.substring(0, 6)}...${finalAddr.substring(finalAddr.length - 4)}`
          : finalAddr;

      setWalletConnected(true);
      setWalletAddress(formatted);
    } catch (e: any) {
      // User rejected or extension errored
      const msg = e?.message || "";
      if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
        // silent — user cancelled
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress("");
  };

  const isNotInstalled = extensionAvailable === false;

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
              fontSize: "0.8rem",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.4)",
              color: "#10b981",
              padding: "0.35rem 0.9rem",
              borderRadius: "99px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}>
              🟢 {walletAddress}
            </span>
            <button
              onClick={handleDisconnect}
              className="btn-secondary"
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.78rem" }}
            >
              Disconnect
            </button>
          </div>
        ) : isNotInstalled ? (
          <a
            href="https://docs.midnight.network/develop/tutorial/using-the-midnight-lace-wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", color: "#f59e0b", borderColor: "rgba(245,158,11,0.4)" }}
          >
            ⚠️ Install Midnight Lace
          </a>
        ) : (
          <button
            id="connect-wallet-btn"
            onClick={handleConnectWallet}
            disabled={connecting}
            className="btn-primary"
            style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem" }}
          >
            {connecting ? (
              <><span className="spinner" /> Waiting for approval...</>
            ) : (
              <><span>👛</span> Connect Wallet</>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
