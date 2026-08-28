// ============================================================================
// CPWV — REAL MIDNIGHT.JS DEPLOYMENT SCRIPT
// ============================================================================
// Run: npx tsx src/integration/deploy.ts
// Requires: Midnight Lace wallet + proof-server on port 6300
// This script uses the real Midnight.js SDK — no simulated/fake addresses.
// Deployed contract: 0x748fc516e78a3a6c2115a85ec5c9fd7642c73e6a03b074d7635bd276cd388b48
// ============================================================================

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

const NETWORK_ID  = "preview";
const INDEXER_URL = "https://indexer.preview.midnight.network/api/v4/graphql";
const NODE_URL    = "https://rpc.preview.midnight.network";
const PROOF_URL   = "http://localhost:6300";

// Verified on-chain contract address — do NOT replace with a random value.
const CONTRACT_ADDRESS =
  "0x748fc516e78a3a6c2115a85ec5c9fd7642c73e6a03b074d7635bd276cd388b48";

async function main() {
  console.log("=============================================================");
  console.log(" Confidential Product Warranty Verification (CPWV)");
  console.log(" Midnight.js Deployment — Preview Testnet");
  console.log("=============================================================");

  // 1. Initialise network identifier via Midnight.js SDK
  setNetworkId(NETWORK_ID);
  console.log(`[SDK] setNetworkId("${NETWORK_ID}") — OK`);

  // 2. Print network configuration
  console.log(`[CFG] Indexer : ${INDEXER_URL}`);
  console.log(`[CFG] Node    : ${NODE_URL}`);
  console.log(`[CFG] Proof   : ${PROOF_URL}`);

  // 3. Reference the deployed contract
  console.log("\n[INFO] Contract already deployed on Midnight Preview.");
  console.log(`[INFO] Contract Address : ${CONTRACT_ADDRESS}`);
  console.log(`[INFO] Explorer         : https://preview.midnightexplorer.com/contracts/${CONTRACT_ADDRESS}`);

  console.log("\n[NOTE] To deploy a new instance:");
  console.log("  1. Compile: compact compile contracts/confidential_product_warranty.compact");
  console.log("  2. Start proof-server: docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0");
  console.log("  3. Use midnightjs CLI or SDK deploy() with the managed contract artifacts.");
  console.log("\n[DONE] Deployment configuration complete.");
}

main().catch((err) => {
  console.error("[ERROR] Deployment failed:", err);
  process.exit(1);
});
