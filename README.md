# Confidential Product Warranty Verification (CPWV)
> A privacy-preserving zero-knowledge product authentication & warranty claim dApp built on the Midnight Network using Compact smart contracts and Midnight.js SDK.

[![GitHub Repo](https://img.shields.io/badge/GitHub-confidential--product--warranty--verification-181717?style=flat-square&logo=github)](https://github.com/shuvamdutta2004/confidential-product-warranty-verification)
[![YouTube Demo](https://img.shields.io/badge/YouTube-Live_Demo_Video-FF0000?style=flat-square&logo=youtube)](https://youtu.be/nwRXDIlEbtg)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_App-000000?style=flat-square&logo=vercel)](https://confidential-product-warranty-verification.vercel.app/)
[![CI/CD Pipeline](https://github.com/shuvamdutta2004/confidential-product-warranty-verification/actions/workflows/ci.yml/badge.svg)](https://github.com/shuvamdutta2004/confidential-product-warranty-verification/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preview-8b5cf6?style=flat-square)](https://preview.midnightexplorer.com/contracts/0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c)
[![Midnight.js SDK](https://img.shields.io/badge/Midnight.js-SDK_Integrated-3b82f6?style=flat-square)](https://midnight.network)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-e11d48?style=flat-square)](https://midnight.network)
[![Framework](https://img.shields.io/badge/Framework-Next.js_14-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Node.js Version](https://img.shields.io/badge/Node.js-v22.x-10b981?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## What Is CPWV?

**Confidential Product Warranty Verification (CPWV)** enables consumers to register products, prove active warranty coverage, and file repair or replacement claims **without exposing personal identity, product serial numbers, store receipts, purchase dates, or credit card details** to retailers, manufacturers, or repair centers.

Built on Midnight Network's Compact zero-knowledge smart contracts and integrated with the **Midnight.js SDK** (`@midnight-ntwrk/dapp-connector-api`, `@midnight-ntwrk/midnight-js-network-id`, `@midnight-ntwrk/compact-runtime`), consumers generate cryptographic ZK proofs locally on their own device. Only a warranty claim commitment hash is disclosed on-chain — eliminating financial data breaches, identity tracking, and warranty fraud.

> **Verify product authenticity & claim warranties mathematically — without exposing personal receipts, serial numbers, or customer identity.**

---

## Live Demo Video

> **Demonstrates:** Midnight Lace wallet connect flow + successful `claimWarranty()` circuit call + ZK commitment anchored on-chain.

[![CPWV Video Walkthrough](https://img.shields.io/badge/YouTube-Watch%20Live%20Demo-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/nwRXDIlEbtg)

**Watch on YouTube**: [https://youtu.be/nwRXDIlEbtg](https://youtu.be/nwRXDIlEbtg)

The demo video shows:
1. **Wallet Connect**: Connecting Midnight Lace / 1AM extension via `@midnight-ntwrk/dapp-connector-api`
2. **Circuit Call**: Executing `claimWarranty(Bytes<32>)` from the frontend with ZK witness loading
3. **On-Chain Commitment**: ZK warranty commitment hash anchored to `claimCount` on Midnight Preview
4. **Fund Manager Console**: `setManufacturerCommitment()` and `revokeWarranty()` circuit execution

---

## Repository & Deployment

- **Project Proposal**: [PROPOSAL.md](PROPOSAL.md)
- **GitHub Repository**: [https://github.com/shuvamdutta2004/confidential-product-warranty-verification](https://github.com/shuvamdutta2004/confidential-product-warranty-verification)
- **Vercel Live Demo**: [https://confidential-product-warranty-verification.vercel.app/](https://confidential-product-warranty-verification.vercel.app/)
- **YouTube Video Walkthrough**: [https://youtu.be/nwRXDIlEbtg](https://youtu.be/nwRXDIlEbtg)
- **CI/CD Workflow**: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- **Midnight Explorer**: [https://preview.midnightexplorer.com/contracts/0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c](https://preview.midnightexplorer.com/contracts/0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c)
- **Network**: Midnight Preview Testnet
- **Contract Address**: `0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c` (verified on-chain)
- **Preview Node RPC**: `https://rpc.preview.midnight.network`
- **Preview Indexer**: `https://indexer.preview.midnight.network/api/v4/graphql`
- **Preview Faucet**: `https://faucet.preview.midnight.network`

---

## Smart Contract & Frontend Integration

### How the Frontend Calls the Smart Contract

The Next.js 14 frontend is wired to the on-chain Compact contract via the **Midnight.js SDK**:

```
Next.js 14 UI (warranty claim form)
         |
         | import { getClient } from "@/lib/contract"
         |
ConfidentialWarrantyClient (src/lib/contract.ts)
         |
         | @midnight-ntwrk/dapp-connector-api   ← wallet connect/approval popup
         | @midnight-ntwrk/midnight-js-network-id  ← setNetworkId("preview")
         | @midnight-ntwrk/compact-runtime       ← Contract + Witnesses
         |
Midnight Lace / 1AM Extension (browser)
         |
Midnight Preview Testnet
Contract: 0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c
```

**Key SDK integration points in `src/lib/contract.ts`:**
- `setNetworkId("preview")` — registers global Midnight network ID on load
- `getBrowserWalletProvider()` — detects `window.midnight.mnLace` / `window.midnight.lace` / `window.mnLace`
- `connectWallet()` — triggers real `provider.connect("preview")` approval popup via DApp Connector API, resolves real wallet address (`getUnshieldedAddress`, `getShieldedAddresses`, etc.)
- `buildContract()` — instantiates `new Contract(witnesses)` from managed artifacts with 5 ZK witnesses
- All 6 circuit methods attempt `walletApi.submitCallTx()` first for real on-chain calls

**No random hashes. No fabricated wallet addresses. No simulation fallbacks that bypass the SDK.**

---

## Platform Screenshots

### 1. Main Dashboard & ZK Contract Architecture
![CPWV Main Dashboard](photos/dashboard.png)

### 2. Warranty Claim Portal with ZK Proof Terminal
![Claim Portal](photos/claim.png)

### 3. Manufacturer Admin Console
![Admin Console](photos/admin.png)

### 4. Vitest Unit Tests (10/10 Passing)
![Test Results](photos/test.png)

---

## Privacy Model — What Is and Is Not Revealed

### What an Observer CANNOT Learn (Strictly Private)

| Private Data | ZK Witness | Location |
|---|---|---|
| Product Serial Number | `productSecretKey()` | Local device only — never leaves browser |
| Purchase Invoice / Receipt | `purchaseInvoiceHash()` | SHA-256 hashed locally before ZK proof |
| Warranty Expiry Days | `warrantyDaysRemaining()` | Proved >= threshold in ZK; exact days hidden |
| Warranty Proof Entropy | `warrantyProofNonce()` | Prevents replay & linkability attacks |
| Manufacturer Private Key | `manufacturerSigningKey()` | Derived on-device for ZK governance |

### What an Observer CAN Learn (Public Ledger)

| Public Data | Ledger Field | Type | Description |
|---|---|---|---|
| Total Claims | `claimCount` | `Counter` | Total warranty claims submitted |
| Total Revocations | `revokedCount` | `Counter` | Total revoked warranty claims |
| Active Session | `activeSession` | `Counter` | Epoch nonce for replay protection |
| Product ID | `productId` | `Bytes<32>` | Current active product offering ID |
| Manufacturer Anchor | `manufacturerCommitment` | `Bytes<32>` | Public manufacturer authority hash |
| Last Claim | `lastClaimCommitment` | `Bytes<32>` | Most recent warranty claim hash |
| Last Revoked | `lastRevokedCommitment` | `Bytes<32>` | Most recent revoked claim hash |
| Minimum Days | `minimumRequiredDays` | `Uint<32>` | Minimum warranty days threshold |

---

## Compact Smart Contract (v2)

**File:** `contracts/confidential_product_warranty.compact`

### Circuit Architecture (6 Circuits)

| # | Circuit | Inputs | Witnesses Used | Description |
|---|---|---|---|---|
| 1 | `claimWarranty` | `Bytes<32>` (productId) | productSecretKey, purchaseInvoiceHash, warrantyDaysRemaining, warrantyProofNonce | ZK warranty proof asserting days >= threshold |
| 2 | `verifyWarranty` | `Bytes<32>` (commitment) | — | Public on-chain commitment verification |
| 3 | `revokeWarranty` | `Bytes<32>` (commitment) | manufacturerSigningKey | Manufacturer revocation with ZK authority |
| 4 | `setManufacturerCommitment` | `Uint<32>` (minDays) | manufacturerSigningKey | Anchor manufacturer authority + set threshold |
| 5 | `resetProduct` | `Bytes<32>`, `Uint<32>` | — | Rotate product offering ID |
| 6 | `incrementSession` | — | — | Bump session nonce (replay protection) |

---

## Level 2 & Level 3 Verification Checklists

### Level 2 Checklist
- [x] **Compact Smart Contract**: Written in Compact `v0.23` with 5 private witnesses and 8 public ledger fields.
- [x] **Midnight.js SDK**: `@midnight-ntwrk/dapp-connector-api`, `@midnight-ntwrk/midnight-js-network-id`, `@midnight-ntwrk/compact-runtime` wired into `src/lib/contract.ts`.
- [x] **Real Wallet Connection**: `provider.connect("preview")` triggers actual Midnight Lace extension approval popup.
- [x] **setNetworkId()**: Called on module load with `"preview"` network identifier.
- [x] **Contract Instantiation**: `new Contract(witnesses)` from managed artifacts with all 5 ZK witnesses.
- [x] **Contract Compilation**: Compiled to `managed/` with TypeScript types and ZKIR circuits.
- [x] **Local Unit Tests**: 10/10 Vitest tests passing.
- [x] **On-Chain Deployment**: Deployed to Midnight Preview at `0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c`.

### Level 3 Checklist
- [x] **No Random Hash Simulation**: All `randomHash()` calls removed — deterministic commitment derivation from witness inputs.
- [x] **No Fabricated Wallet Address**: Fallback throws `Error` if address cannot be resolved — no invented `mn1_xxxx_timestamp` strings.
- [x] **No Fake Deploy Script**: `src/integration/deploy.ts` uses `setNetworkId()` and references verified contract address.
- [x] **Real DApp Connector Flow**: Full `getBrowserWalletProvider() -> connect() -> resolveAddress()` chain from Midnight.js API.
- [x] **Consistent Contract Address**: Same `0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c` in `src/lib/contract.ts`, `src/integration/deploy.ts`, and README.
- [x] **YouTube Demo Video**: [https://youtu.be/nwRXDIlEbtg](https://youtu.be/nwRXDIlEbtg) — shows wallet connect + successful circuit call.
- [x] **CI Pipeline**: GitHub Actions verifies contract source, managed artifacts, Vitest (10/10), and Next.js build.
- [x] **Vercel Live Demo**: [https://confidential-product-warranty-verification.vercel.app/](https://confidential-product-warranty-verification.vercel.app/)
