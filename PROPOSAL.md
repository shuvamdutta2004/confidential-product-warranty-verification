# Project Proposal: Confidential Product Warranty Verification (CPWV)
> Privacy-Preserving Zero-Knowledge Product Authentication & Warranty Claim Protocol on Midnight Network

---

## Live Demo Video

> **Demonstrates wallet connect + successful claimWarranty() circuit call from the frontend.**

[![CPWV Video Walkthrough](https://img.shields.io/badge/YouTube-Watch%20Live%20Demo-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/rnHPdSnrsLw)

**Watch on YouTube**: [https://youtu.be/rnHPdSnrsLw](https://youtu.be/rnHPdSnrsLw)

---

## Question 1: What is the application?

**Confidential Product Warranty Verification (CPWV)** is a decentralized, privacy-preserving product authentication and warranty claim platform built on the Midnight Network using Compact zero-knowledge smart contracts and the **Midnight.js SDK** (`@midnight-ntwrk/dapp-connector-api`, `@midnight-ntwrk/midnight-js-network-id`, `@midnight-ntwrk/compact-runtime`).

Consumers prove active warranty coverage without revealing their serial numbers, store receipts, purchase dates, or personal identity. Manufacturers anchor product authority and configure warranty thresholds. The entire product authentication and warranty claim flow is executed as ZK circuit proofs on the local device — only cryptographic commitment hashes are anchored on the Midnight public ledger.

---

## Question 2: What problem does it solve?

Current warranty claim processes expose sensitive consumer data to:
1. **Data breaches**: Retailers and manufacturers store millions of purchase receipts, addresses, and payment info in vulnerable centralized databases.
2. **Warranty fraud**: Without cryptographic proof, manufacturers cannot verify legitimate claims without exposing consumer PII.
3. **Identity tracking**: Serial number registration links consumer identity to product usage patterns indefinitely.

CPWV eliminates all three by proving warranty eligibility in zero-knowledge:
- `assert(warrantyDaysRemaining >= minimumRequiredDays)` — proves days without revealing the exact purchase date.
- Purchase invoice hashed locally — the original receipt never leaves the consumer's device.
- Product serial bound to a commitment hash — not the raw serial number.

---

## Question 3: How is Midnight used?

### 1. Midnight.js SDK (Frontend Integration)
- **`@midnight-ntwrk/dapp-connector-api`**: `DAppConnectorAPI`, `ConnectedAPI`, `InitialAPI` types power the real browser wallet connection with approval popup.
- **`@midnight-ntwrk/midnight-js-network-id`**: `setNetworkId("preview")` initialises global Midnight network context.
- **`@midnight-ntwrk/compact-runtime`**: `Contract`, `Witnesses`, `Ledger` types power the managed contract instantiation.

### 2. Compact Smart Contract (6 Circuits)
All circuits are defined in `contracts/confidential_product_warranty.compact` (Compact v0.23):

- **`claimWarranty(Bytes<32>)`**: Core ZK circuit. Verifies product ID match, asserts `warrantyDaysRemaining >= minimumRequiredDays` in ZK, generates 256-bit claim commitment.
- **`verifyWarranty(Bytes<32>)`**: Public on-chain commitment verification.
- **`revokeWarranty(Bytes<32>)`**: Manufacturer moderation circuit (requires `manufacturerSigningKey()` witness).
- **`setManufacturerCommitment(Uint<32>)`**: Anchors manufacturer authority + configures threshold.
- **`resetProduct(Bytes<32>, Uint<32>)`**: Rotates product offering ID.
- **`incrementSession()`**: Monotonic nonce bump for replay protection.

### 3. Real DApp Connector Flow (No Simulation)
```typescript
// src/lib/contract.ts — real Midnight.js SDK connection
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { DAppConnectorAPI, ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Contract, type Witnesses } from "../../managed/contract/index.js";

setNetworkId("preview"); // real network ID registration

// Real wallet connection — triggers extension popup
const provider = window.midnight.mnLace; // DApp Connector detection
const connectedApi = await provider.connect("preview"); // approval popup
const address = await connectedApi.getUnshieldedAddress(); // real address

// Real contract instantiation with 5 ZK witnesses
const contract = new Contract({
  productSecretKey: (ctx) => [ctx, strToBytes32(productKey)],
  purchaseInvoiceHash: (ctx) => [ctx, strToBytes32(invoiceHash)],
  warrantyDaysRemaining: (ctx) => [ctx, BigInt(warrantyDays)],
  warrantyProofNonce: (ctx) => [ctx, strToBytes32(nonce)],
  manufacturerSigningKey: (ctx) => [ctx, strToBytes32(mfrKey)],
});
```

---

## Question 4: What are the privacy guarantees?

| Information | Visibility | Guarantee |
|---|---|---|
| Product Serial Number | **Private** | Local device only; `productSecretKey()` witness |
| Purchase Receipt / Invoice | **Private** | SHA-256 hashed locally; `purchaseInvoiceHash()` witness |
| Exact Warranty Days Remaining | **Private** | Proved >= threshold in ZK; exact count hidden |
| Warranty Proof Entropy | **Private** | Nonce prevents replay and linkability |
| Manufacturer Private Key | **Private** | Derived on-device; `manufacturerSigningKey()` witness |
| Total Claims (Counter) | **Public** | `claimCount` ledger field |
| Warranty Commitment Hash | **Public** | One-way hash for public verification |
| Minimum Required Days | **Public** | `minimumRequiredDays` ledger field |

---

## Deployment

- **Contract Address**: `0x748fc516e78a3a6c2115a85ec5c9fd7642c73e6a03b074d7635bd276cd388b48` (Midnight Preview, verified)
- **Midnight Explorer**: [View Contract](https://preview.midnightexplorer.com/contracts/0x748fc516e78a3a6c2115a85ec5c9fd7642c73e6a03b074d7635bd276cd388b48)
- **YouTube Demo**: [https://youtu.be/rnHPdSnrsLw](https://youtu.be/rnHPdSnrsLw) — wallet connect + circuit call demonstrated
- **Vercel Live Demo**: [https://confidential-product-warranty-verification.vercel.app/](https://confidential-product-warranty-verification.vercel.app/)
- **Framework**: Next.js 14 App Router + Compact v0.23 + Midnight.js SDK

---

## Level 3 Compliance Checklist

- [x] **Real Midnight.js SDK**: `@midnight-ntwrk/dapp-connector-api`, `@midnight-ntwrk/midnight-js-network-id`, `@midnight-ntwrk/compact-runtime` integrated.
- [x] **No Simulations**: All `randomHash()` removed. No fabricated wallet address fallbacks.
- [x] **No Fake Deploy Script**: `src/integration/deploy.ts` uses `setNetworkId()`, references verified contract address.
- [x] **Consistent Contract Address**: Same address in `src/lib/contract.ts`, `deploy.ts`, and README.
- [x] **YouTube Demo Video**: Shows wallet connect + successful `claimWarranty()` circuit call from the frontend.
- [x] **10/10 Vitest Tests**: All passing.
- [x] **Next.js Production Build**: All 5 static routes generated with 0 errors.
- [x] **GitHub Actions CI**: Verifies contract source, managed artifacts, tests, and build.
