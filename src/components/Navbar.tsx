"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar({
  walletAddress,
  onConnect,
  onDisconnect,
  connecting,
}: {
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const short = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="nav-header">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Brand Pill (like NeuroFlux in screenshot) */}
        <Link href="/" className="nav-brand-pill">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          CPWV
        </Link>

        {/* Menu Pill dropdown toggle */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="nav-menu-pill"
            style={{ cursor: "pointer", outline: "none" }}
          >
            Menu
            <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>≡</span>
          </button>

          {/* Nav Dropdown Menu */}
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                background: "rgba(10, 12, 20, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                padding: "0.5rem",
                minWidth: "220px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {[
                { label: "Dashboard", href: "/" },
                { label: "Claim & Verify", href: "/claim" },
                { label: "Manufacturer Console", href: "/admin" },
                { label: "Preview Explorer", href: "/explorer" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "0.6rem 0.9rem",
                    borderRadius: "8px",
                    fontSize: "0.84rem",
                    color: pathname === item.href ? "#ffffff" : "#94a3b8",
                    background: pathname === item.href ? "rgba(255,255,255,0.08)" : "transparent",
                    fontWeight: pathname === item.href ? 600 : 400,
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Direct Navigation Links (visible on desktop) */}
        <nav style={{ display: "none", alignItems: "center", gap: "0.5rem" }} className="desktop-nav">
          <Link href="/" className={`nav-menu-pill ${pathname === "/" ? "active" : ""}`}>
            Dashboard
          </Link>
          <Link href="/claim" className={`nav-menu-pill ${pathname === "/claim" ? "active" : ""}`}>
            Claim & Verify
          </Link>
          <Link href="/admin" className={`nav-menu-pill ${pathname === "/admin" ? "active" : ""}`}>
            Manufacturer
          </Link>
          <Link href="/explorer" className={`nav-menu-pill ${pathname === "/explorer" ? "active" : ""}`}>
            Explorer
          </Link>
        </nav>
      </div>

      {/* Right: Get Started / Wallet Action (matching top right pill in screenshot) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {walletAddress ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                padding: "0.45rem 1rem",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontWeight: 600,
              }}
            >
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              {short}
            </span>
            <button
              onClick={onDisconnect}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "0.8rem",
                padding: "0.45rem",
              }}
              title="Disconnect Wallet"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            id="connect-wallet-btn"
            onClick={onConnect}
            disabled={connecting}
            className="nav-cta-pill"
          >
            {connecting ? "Connecting..." : "Get Started ↗"}
          </button>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
