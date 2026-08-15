# Project Proposal: Confidential Product Warranty Verification (CPWV)

> **Zero-Knowledge Product Authentication, Warranty Claim & Proof Protocol on Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preview-8b5cf6?style=flat-square)](https://preview.midnightexplorer.com)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-e11d48?style=flat-square)](https://midnight.network)
[![Framework](https://img.shields.io/badge/Framework-Next.js_14-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## ❓ Question 1: What is the project about?

**Confidential Product Warranty Verification (CPWV)** is a privacy-preserving decentralized application (dApp) built on the **Midnight Network** utilizing **Compact zero-knowledge (ZK) smart contracts**. CPWV enables consumers to register products, prove warranty coverage, and file repair or replacement claims **without exposing personal identity, exact purchase dates, invoice details, bank transaction records, or product serial keys** to retailers, manufacturers, or third-party repair centers.

Traditional warranty claim processes force consumers into invasive data submission pipelines: customers must upload unencrypted purchase receipts, credit card statements, and personal identity documents to centralized databases. These databases are frequent targets of data breaches, marketing telemetry harvesting, and serial number spoofing. CPWV replaces this model with a ZK architecture where:

- **Private proofs are generated client-side inside the consumer's browser**
- **Only a cryptographic warranty claim commitment hash is written to the Midnight chain**
- **No raw serial numbers, personal identity attributes, or purchase receipts touch the network**

The smart contract (`contracts/confidential_product_warranty.compact`) implements 6 circuits that cover the complete product lifecycle: warranty claiming, public claim verification, manufacturer warranty revocation, manufacturer authority setup, product model rotation, and session management.

---

## ❓ Question 2: What problem does it solve?

### The Privacy & Fraud Crisis in Product Warranties

1. **Mass Over-Disclosure of Consumer Data**: Customers are forced to hand over store receipts, credit card details, residential addresses, and phone numbers to process simple warranty repairs or replacements.

2. **Centralized Receipt & Serial Breaches**: Retailer databases storing customer invoices and product serial numbers are prime targets for ransomware, identity theft, and counterfeit serial harvesting.

3. **Warranty & Serial Spoofing Fraud**: Malicious actors harvest exposed serial numbers to file fraudulent warranty replacement claims on non-existent or out-of-warranty items.

4. **Lack of Anti-Replay Protection**: Without ZK commitment binding and session nonces, stolen static proof documents can be reused across multiple repair providers.

5. **No Trustless Warranty Revocation**: Manufacturers lack a privacy-preserving mechanism to void or revoke fraudulent claims on-chain without exposing private customer registries.

### How CPWV Solves This

| Problem | CPWV Solution |
|---|---|
| Identity & serial leaks | `productSecretKey()` witness — calculated locally on consumer device, never disclosed |
| Purchase & invoice exposure | `purchaseInvoiceHash()` — SHA-256 hashed locally before ZK proof generation |
| Expired claim fraud | `warrantyDaysRemaining()` witness — compared privately to requirement (`assert(days >= minimumRequiredDays)`) |
| Serial replay fraud | `warrantyProofNonce()` + `activeSession` epoch counter binding |
| Unauthorized revocation | `revokeWarranty()` circuit with ZK manufacturer authority proof |
| Product model spoofing | `manufacturerCommitment` anchor — `setManufacturerCommitment()` circuit |

---

## ❓ Question 3: How does the Midnight ZK architecture work?

### Compact Smart Contract Design (`contracts/confidential_product_warranty.compact`)

CPWV uses Midnight's **dual-state model**: private witnesses computed locally on-device vs. public ledger state stored on-chain.

#### Ledger State (8 public fields)

| Ledger Field | Type | Description |
|---|---|---|
| `claimCount` | `Counter` | Total verified warranty claims filed |
| `revokedCount` | `Counter` | Total revoked/voided warranties |
| `activeSession` | `Counter` | Epoch nonce for replay protection |
| `productId` | `Bytes<32>` | Active product model identifier |
| `manufacturerCommitment` | `Bytes<32>` | Manufacturer public authority commitment |
| `lastClaimCommitment` | `Bytes<32>` | Most recent ZK warranty claim hash |
| `lastRevokedCommitment` | `Bytes<32>` | Most recent revoked commitment hash |
| `minimumRequiredDays` | `Uint<32>` | Minimum active warranty days required |

#### Witnesses (5 private inputs — never disclosed)

| Witness | Type | Purpose |
|---|---|---|
| `productSecretKey()` | `Bytes<32>` | Customer private serial secret key |
| `warrantyProofNonce()` | `Bytes<32>` | Entropy salt (replay-resistance) |
| `purchaseInvoiceHash()` | `Bytes<32>` | Hashed receipt & invoice record |
| `warrantyDaysRemaining()` | `Uint<32>` | Private active days balance (vs. requirement) |
| `manufacturerSigningKey()` | `Bytes<32>` | Manufacturer admin authorization key |

#### Circuit Architecture (6 circuits)

| Circuit | Inputs | Witnesses Used | Business Logic |
|---|---|---|---|
| `claimWarranty` | `Bytes<32>` productId | productSecretKey, warrantyProofNonce, purchaseInvoiceHash, warrantyDaysRemaining | ZK warranty claim with private active days threshold assertion |
| `verifyWarranty` | `Bytes<32>` commitment | — | Public on-chain commitment verification |
| `revokeWarranty` | `Bytes<32>` commitment | manufacturerSigningKey | Revoke a fraudulent claim — ZK manufacturer authority required |
| `setManufacturerCommitment` | `Uint<32>` threshold | manufacturerSigningKey | Anchor manufacturer authority + set active days threshold |
| `resetProduct` | `Bytes<32>`, `Uint<32>` | — | New product epoch with updated days threshold |
| `incrementSession` | — | — | Bump session nonce (replay protection) |

#### ZK Privacy Flow

```
[Consumer's Device]
  +- productSecretKey()       ?  ZK witness (private, never disclosed)
  +- warrantyProofNonce()     ?  ZK witness (private, never disclosed)
  +- purchaseInvoiceHash()    ?  ZK witness (private, never disclosed)
  +- warrantyDaysRemaining()  ?  assert(days >= minimumRequiredDays) ? ZK constraint
  +- persistentHash<Vector<5, Bytes<32>>>([domain, key, nonce, invoice, session])
                              ?  claimCommitment (only this is disclosed on-chain)

[Midnight Chain]
  +- lastClaimCommitment: 0x05a1b3c9... ? only the hash is stored
```

---

## ❓ Question 4: What are the privacy guarantees and threat model?

### What an Observer CANNOT Learn (Strictly Private)

| Sensitive Data | Protected By | Guarantee |
|---|---|---|
| Consumer identity & address | `productSecretKey()` ZK witness | Never transmitted — local device only |
| Exact purchase date & invoice | `purchaseInvoiceHash()` ZK witness | SHA-256 hashed locally — only hash in proof |
| Active warranty days balance | `warrantyDaysRemaining()` ZK witness | Compared privately to threshold — balance never disclosed |
| Entropy/nonce | `warrantyProofNonce()` ZK witness | Per-claim entropy — replay-resistant |
| Manufacturer signing key | `manufacturerSigningKey()` ZK witness | Derived locally for authorization — key never on-chain |

### What an Observer CAN Learn (Public Ledger)

| Public Data | Ledger Field | Rationale |
|---|---|---|
| Total filed claims | `claimCount` | Auditability & service metric — no user attribution |
| Active product model ID | `productId` | Consumers must know which product model is active |
| Most recent claim hash | `lastClaimCommitment` | Repair centers use `verifyWarranty()` to check claims |
| Total revocations | `revokedCount` | Transparency for voided warranties |
| Minimum active days threshold | `minimumRequiredDays` | Transparent qualification standard for warranty |
| Session epoch | `activeSession` | Verifiers can detect stale proofs |

### Threat Model

| Threat | Mitigation |
|---|---|
| On-chain eavesdropping | ZK commitments reveal zero serial keys or invoice data |
| Serial number harvesting | `productSecretKey()` + session binding in `Vector<5, Bytes<32>>` hash |
| Manufacturer impersonation | `manufacturerCommitment` anchor + `assert(derivedCommitment == manufacturerCommitment)` |
| Fraudulent warranty claim | `revokeWarranty()` with ZK manufacturer authorization |
| Expired warranty claims | `minimumRequiredDays` enforced on-chain via ZK assertion |
| Cross-product spoofing | `assert(productId == expectedProductId)` enforces product binding |

---

## 🎥 Live Demo Video

- **YouTube Walkthrough**: [https://youtu.be/nwRXDIlEbtg](https://youtu.be/nwRXDIlEbtg)

## 🌐 Deployment & Infrastructure

- **Network**: Midnight Preview Testnet
- **Proof Server**: Docker `midnightntwrk/proof-server:8.1.0` at `localhost:6300`
- **Indexer**: `https://indexer.preview.midnight.network/api/v4/graphql`
- **Frontend**: Next.js 14 App Router deployed on Vercel
- **Live Demo**: [https://confidential-product-warranty-verification.vercel.app/](https://confidential-product-warranty-verification.vercel.app/)

---

## ??? Level 3 Compliance Checklist

- [x] **Rich Contract Logic (v2)**: 6 circuits, 8 ledger fields, 5 witnesses — ZK warranty days assertion, claim revocation, manufacturer authority.
- [x] **Compact Smart Contract**: Written in `Compact v0.23` with `persistentHash`, `disclose`, `assert`, Counter, and `Uint<32>` types.
- [x] **Managed Contract Output**: Pre-compiled `managed/contract/index.js` + `index.d.ts` with full TypeScript type bindings.
- [x] **Vitest Unit Test Suite**: 10/10 tests passing — covers circuit structure, witness isolation, warranty days qualification, ZK privacy, mfr auth.
- [x] **CI Pipeline**: GitHub Actions verifies Compact source, managed output, runs tests, and builds Next.js on every push.
- [x] **Next.js 14 App Router UI**: Full dApp with ZK architecture diagrams, warranty days slider, verify/revoke panels.
- [x] **Browser Proof Generation**: Client-side ZK proof generation and Midnight Lace wallet connector.
- [x] **Live Vercel Demo**: [https://confidential-product-warranty-verification.vercel.app/](https://confidential-product-warranty-verification.vercel.app/).

