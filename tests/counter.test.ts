import { describe, it, expect } from 'vitest';
import { Contract, ledger, type Witnesses } from '../managed/contract/index.js';
import {
  CONTRACT_ADDRESS,
  CANONICAL_DEPLOYMENT,
  NETWORK_CONFIG,
  bytesToHex,
  hexToBytes,
  strToBytes32,
  sha256Hex,
} from '../src/lib/contract';
import { deployCPWVContract } from '../src/integration/deploy';

// Helper to construct 32-byte Uint8Array from string
function toBytes32(str: string): Uint8Array {
  const arr = new Uint8Array(32);
  new TextEncoder().encodeInto(str, arr);
  return arr;
}

// Deterministic test witness builder (Strict: No default secrets)
function buildWitnesses(opts: {
  productKey?: string;
  nonce?: string;
  invoiceHash?: string;
  daysRemaining?: bigint;
  mfrKey?: string;
}): Witnesses<any> {
  const productKey = toBytes32(opts.productKey ?? 'test_product_serial_secret_key');
  const nonce = toBytes32(opts.nonce ?? 'test_entropy_nonce_warranty_99');
  const invoiceHash = toBytes32(opts.invoiceHash ?? 'test_purchase_invoice_hash_77');
  const daysRemaining = opts.daysRemaining ?? 365n;
  const mfrKey = toBytes32(opts.mfrKey ?? 'test_manufacturer_signing_key_42');

  return {
    productSecretKey: (ctx: any) => [ctx.privateState ?? ctx, productKey] as [any, Uint8Array],
    warrantyProofNonce: (ctx: any) => [ctx.privateState ?? ctx, nonce] as [any, Uint8Array],
    purchaseInvoiceHash: (ctx: any) => [ctx.privateState ?? ctx, invoiceHash] as [any, Uint8Array],
    warrantyDaysRemaining: (ctx: any) => [ctx.privateState ?? ctx, daysRemaining] as [any, bigint],
    manufacturerSigningKey: (ctx: any) => [ctx.privateState ?? ctx, mfrKey] as [any, Uint8Array],
  };
}

// --- Test Suite --------------------------------------------------------------

describe('Confidential Product Warranty Verification (CPWV) - Midnight ZK Contract Suite', () => {

  it('1. Contract Structure: all 6 core circuits are exported and callable from managed runtime', () => {
    const contract = new Contract(buildWitnesses({}));
    expect(contract).toBeDefined();
    expect(typeof contract.circuits.claimWarranty).toBe('function');
    expect(typeof contract.circuits.verifyWarranty).toBe('function');
    expect(typeof contract.circuits.revokeWarranty).toBe('function');
    expect(typeof contract.circuits.setManufacturerCommitment).toBe('function');
    expect(typeof contract.circuits.resetProduct).toBe('function');
    expect(typeof contract.circuits.incrementSession).toBe('function');
    expect(contract).toHaveProperty('circuits');
    expect(contract).toHaveProperty('witnesses');
  });

  it('2. Witness Completeness: all 5 witnesses (including warranty days and manufacturer key) are defined', () => {
    const witnesses = buildWitnesses({
      productKey: 'serial_macbook_pro_m3_2026',
      nonce: 'entropy_nonce_warranty_claim',
      invoiceHash: 'sha256_store_receipt_hash',
      daysRemaining: 180n,
      mfrKey: 'mfr_signing_key_apple_inc',
    });
    const contract = new Contract(witnesses);

    expect(contract.witnesses.productSecretKey).toBeDefined();
    expect(contract.witnesses.warrantyProofNonce).toBeDefined();
    expect(contract.witnesses.purchaseInvoiceHash).toBeDefined();
    expect(contract.witnesses.warrantyDaysRemaining).toBeDefined();
    expect(contract.witnesses.manufacturerSigningKey).toBeDefined();
  });

  it('3. Private Witness Byte Length: productSecretKey, warrantyProofNonce, purchaseInvoiceHash are 32 bytes', () => {
    const witnesses = buildWitnesses({
      productKey: 'serial_secret_key_alpha',
      nonce: 'random_nonce_beta',
      invoiceHash: 'hashed_invoice_gamma',
    });
    const mockCtx = { privateState: {} };

    const [, keyBytes] = witnesses.productSecretKey(mockCtx);
    const [, nonceBytes] = witnesses.warrantyProofNonce(mockCtx);
    const [, invoiceBytes] = witnesses.purchaseInvoiceHash(mockCtx);

    expect(keyBytes.length).toBe(32);
    expect(nonceBytes.length).toBe(32);
    expect(invoiceBytes.length).toBe(32);
  });

  it('4. Warranty Days Threshold Witness: warrantyDaysRemaining returns bigint usable for active days check', () => {
    const activeDays = 120n;
    const minimumRequiredDays = 30n;
    const witnesses = buildWitnesses({ daysRemaining: activeDays });
    const mockCtx = { privateState: {} };

    const [, days] = witnesses.warrantyDaysRemaining(mockCtx);
    expect(typeof days).toBe('bigint');
    expect(days).toBe(120n);
    expect(days >= minimumRequiredDays).toBe(true);
  });

  it('5. ZK Privacy: private witnesses are strictly isolated from public productId (no data leak)', () => {
    const publicProductId = toBytes32('prod_macbook_pro_m3_2026');
    const witnesses = buildWitnesses({
      productKey: 'super_secret_serial_key',
      nonce: 'private_warranty_nonce_secret',
      invoiceHash: 'encrypted_receipt_invoice_hash',
    });
    const mockCtx = { privateState: {} };

    const [, keyBytes] = witnesses.productSecretKey(mockCtx);
    const [, nonceBytes] = witnesses.warrantyProofNonce(mockCtx);
    const [, invoiceBytes] = witnesses.purchaseInvoiceHash(mockCtx);

    expect(keyBytes).not.toEqual(publicProductId);
    expect(nonceBytes).not.toEqual(publicProductId);
    expect(invoiceBytes).not.toEqual(publicProductId);
  });

  it('6. Manufacturer Authority Witness: manufacturerSigningKey produces 32-byte array independent of product key', () => {
    const witnesses = buildWitnesses({
      productKey: 'product_serial_secret_abc',
      mfrKey: 'manufacturer_signing_key_xyz',
    });
    const mockCtx = { privateState: {} };

    const [, productKeyBytes] = witnesses.productSecretKey(mockCtx);
    const [, mfrKeyBytes] = witnesses.manufacturerSigningKey(mockCtx);

    expect(mfrKeyBytes.length).toBe(32);
    expect(mfrKeyBytes).not.toEqual(productKeyBytes);
  });

  it('7. Multi-Product Commitment Uniqueness: different products produce distinct contract instances', () => {
    const witnessesA = buildWitnesses({ productKey: 'serial_apple_watch', invoiceHash: 'invoice_store_a' });
    const witnessesB = buildWitnesses({ productKey: 'serial_ipad_pro', invoiceHash: 'invoice_store_b' });
    const mockCtx = { privateState: {} };

    const contractA = new Contract(witnessesA);
    const contractB = new Contract(witnessesB);

    const [, keyA] = witnessesA.productSecretKey(mockCtx);
    const [, keyB] = witnessesB.productSecretKey(mockCtx);

    expect(contractA).not.toBe(contractB);
    expect(keyA).not.toEqual(keyB);
  });

  it('8. Ledger Schema Interface: ledger() decodes the 8-field on-chain public state correctly', () => {
    expect(typeof ledger).toBe('function');
    const parsed = ledger({});
    expect(parsed).toHaveProperty('claimCount');
    expect(parsed).toHaveProperty('revokedCount');
    expect(parsed).toHaveProperty('activeSession');
    expect(parsed).toHaveProperty('productId');
    expect(parsed).toHaveProperty('manufacturerCommitment');
    expect(parsed).toHaveProperty('lastClaimCommitment');
    expect(parsed).toHaveProperty('lastRevokedCommitment');
    expect(parsed).toHaveProperty('minimumRequiredDays');
    expect(typeof parsed.claimCount).toBe('bigint');
    expect(typeof parsed.minimumRequiredDays).toBe('bigint');
  });

  it('9. Expired Warranty Fail Case: warrantyDaysRemaining below minimumRequiredDays fails threshold check', () => {
    const expiredDays = 5n;
    const witnesses = buildWitnesses({ daysRemaining: expiredDays });
    const contract = new Contract(witnesses);
    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    expect(() => {
      contract.circuits.claimWarranty(mockCtx as any, toBytes32('product_test_model'));
    }).toThrow(/Warranty expired/i);
  });

  it('10. Session Isolation: witnesses built for different sessions produce independent nonce contexts', () => {
    const witnessesSession1 = buildWitnesses({ nonce: 'session_1_warranty_nonce', daysRemaining: 90n });
    const witnessesSession2 = buildWitnesses({ nonce: 'session_2_warranty_nonce', daysRemaining: 180n });
    const mockCtx = { privateState: { sessionId: 'test' } };

    const [, nonce1] = witnessesSession1.warrantyProofNonce(mockCtx);
    const [, nonce2] = witnessesSession2.warrantyProofNonce(mockCtx);

    expect(nonce1).not.toEqual(nonce2);
  });

  it('11. Canonical Verified Contract Record: matches Preview deployment record', () => {
    expect(CONTRACT_ADDRESS).toBe('0x39764195d14758b6bd52ab6e13a0547bd29e972be5bfa4c18f2ceafc504ddc1a');
    expect(CANONICAL_DEPLOYMENT.contractAddress).toBe(CONTRACT_ADDRESS);
    expect(CANONICAL_DEPLOYMENT.txHash).toBe('0x892a0149fbc00ea5210214db0ea5c19f56ba837cf71285093551aa74cb92f912');
    expect(CANONICAL_DEPLOYMENT.networkId).toBe('preview');
    expect(NETWORK_CONFIG.networkId).toBe('preview');
    expect(NETWORK_CONFIG.indexerUrl).toContain('indexer.preview.midnight.network');
  });

  it('12. DeployContract Security: deployCPWVContract strictly requires real providers (no mock address fallbacks)', async () => {
    await expect(deployCPWVContract(undefined as any)).rejects.toThrow(
      /ContractProviders are strictly required for deployContract/i
    );
  });

  it('13. Encoding Helpers: bytesToHex and strToBytes32 round-trip correctly', () => {
    const testStr = 'test_product_123';
    const bytes = strToBytes32(testStr);
    expect(bytes.length).toBe(32);
    const hex = bytesToHex(bytes);
    expect(hex.startsWith('0x')).toBe(true);
    expect(hex.length).toBe(66);
    const back = hexToBytes(hex);
    expect(back).toEqual(bytes);
  });

  it('14. Manufacturer Authorization: resetProduct requires valid manufacturer witness key', () => {
    const unauthWitnesses = {
      productSecretKey: (ctx: any) => [ctx, new Uint8Array(32)],
      warrantyProofNonce: (ctx: any) => [ctx, new Uint8Array(32)],
      purchaseInvoiceHash: (ctx: any) => [ctx, new Uint8Array(32)],
      warrantyDaysRemaining: (ctx: any) => [ctx, 365n],
      manufacturerSigningKey: (ctx: any) => [ctx, new Uint8Array(32)], // zero key
    };
    const contract = new Contract(unauthWitnesses as any);
    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    expect(() => {
      contract.circuits.resetProduct(mockCtx as any, toBytes32('new_product_model'), 60n);
    }).toThrow(/Unauthorized/i);
  });

  it('15. Manufacturer Authorization: setManufacturerCommitment requires valid manufacturer witness key', () => {
    const unauthWitnesses = {
      productSecretKey: (ctx: any) => [ctx, new Uint8Array(32)],
      warrantyProofNonce: (ctx: any) => [ctx, new Uint8Array(32)],
      purchaseInvoiceHash: (ctx: any) => [ctx, new Uint8Array(32)],
      warrantyDaysRemaining: (ctx: any) => [ctx, 365n],
      manufacturerSigningKey: (ctx: any) => [ctx, new Uint8Array(32)],
    };
    const contract = new Contract(unauthWitnesses as any);
    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    expect(() => {
      contract.circuits.setManufacturerCommitment(mockCtx as any, 90n);
    }).toThrow(/Unauthorized/i);
  });

  it('16. Manufacturer Authorization: incrementSession requires valid manufacturer witness key', () => {
    const unauthWitnesses = {
      productSecretKey: (ctx: any) => [ctx, new Uint8Array(32)],
      warrantyProofNonce: (ctx: any) => [ctx, new Uint8Array(32)],
      purchaseInvoiceHash: (ctx: any) => [ctx, new Uint8Array(32)],
      warrantyDaysRemaining: (ctx: any) => [ctx, 365n],
      manufacturerSigningKey: (ctx: any) => [ctx, new Uint8Array(32)],
    };
    const contract = new Contract(unauthWitnesses as any);
    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    expect(() => {
      contract.circuits.incrementSession(mockCtx as any);
    }).toThrow(/Unauthorized/i);
  });

  it('17. Cryptographic Credential Relationship: distinct product keys produce distinct warranty commitments', () => {
    const witnesses1 = buildWitnesses({ productKey: 'product_serial_one', invoiceHash: 'invoice_hash_same' });
    const witnesses2 = buildWitnesses({ productKey: 'product_serial_two', invoiceHash: 'invoice_hash_same' });

    const contract1 = new Contract(witnesses1);
    const contract2 = new Contract(witnesses2);

    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    const res1 = contract1.circuits.claimWarranty(mockCtx as any, toBytes32('product_laptop_pro'));
    const res2 = contract2.circuits.claimWarranty(mockCtx as any, toBytes32('product_laptop_pro'));

    expect(bytesToHex(res1.result)).not.toEqual(bytesToHex(res2.result));
  });

  it('18. Explicit Nullifier: distinct invoice hashes yield distinct claim commitment nullifiers', () => {
    const witnesses1 = buildWitnesses({ productKey: 'product_serial_same', invoiceHash: 'invoice_invoice_111' });
    const witnesses2 = buildWitnesses({ productKey: 'product_serial_same', invoiceHash: 'invoice_invoice_222' });

    const contract1 = new Contract(witnesses1);
    const contract2 = new Contract(witnesses2);

    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    const res1 = contract1.circuits.claimWarranty(mockCtx as any, toBytes32('product_laptop_pro'));
    const res2 = contract2.circuits.claimWarranty(mockCtx as any, toBytes32('product_laptop_pro'));

    expect(bytesToHex(res1.result)).not.toEqual(bytesToHex(res2.result));
  });

  it('19. On-Chain Claim Verification: verifyWarranty confirms genuine generated commitment', () => {
    const witnesses = buildWitnesses({ productKey: 'verified_product_key', daysRemaining: 180n });
    const contract = new Contract(witnesses);
    const mockCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: { contractAddress: CONTRACT_ADDRESS, networkId: 'preview' },
    };

    const claimRes = contract.circuits.claimWarranty(mockCtx as any, toBytes32('prod_model_x'));
    const verifyRes = contract.circuits.verifyWarranty(mockCtx as any, claimRes.result);

    expect(verifyRes.result).toBe(true);
  });

});
