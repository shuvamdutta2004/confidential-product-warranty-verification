import { deployCPWVContract, CONTRACT_ADDRESS, NETWORK_ID, INDEXER_URL, NODE_URL, PROOF_SERVER_URL } from "../src/integration/deploy.js";

console.log("=============================================================");
console.log(" Confidential Product Warranty Verification (CPWV)");
console.log(" Midnight.js Deployment Execution Runner");
console.log("=============================================================");
console.log(`Network ID: ${NETWORK_ID}`);
console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
console.log(`Indexer URL: ${INDEXER_URL}`);
console.log(`RPC Node URL: ${NODE_URL}`);
console.log(`Proof Server: ${PROOF_SERVER_URL}`);

const res = await deployCPWVContract();
console.log(`Deployment verified: ${res.contractAddress}`);
console.log(`Explorer: ${res.explorerUrl}`);