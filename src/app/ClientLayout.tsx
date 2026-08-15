"use client";
import { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { getClient } from "../lib/contract";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const ok = sessionStorage.getItem("cpwv_wallet_connected") === "true";
    const addr = sessionStorage.getItem("cpwv_wallet_address");
    return ok && addr ? addr : null;
  });
  const [connecting, setConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await getClient().connectWallet();
      setWalletAddress(res.walletAddress);
    } catch (err: any) {
      alert(err?.message || "Wallet connection failed.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    getClient().disconnectWallet();
    setWalletAddress(null);
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar walletAddress={walletAddress} onConnect={handleConnect} onDisconnect={handleDisconnect} connecting={connecting} />
      <main>{children}</main>
    </div>
  );
}
