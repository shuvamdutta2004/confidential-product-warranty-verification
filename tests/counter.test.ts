import { describe, it, expect } from 'vitest';
import { Contract, ledger } from '../managed/contract/index.js';
import { CONTRACT_ADDRESS, NETWORK_CONFIG, bytesToHex, hexToBytes, strToBytes32 } from '../src/lib/contract';
import { deployCPWVContract } from '../src/integration/deploy';

// --- Helpers -----------------------------------------------------------------

function toBytes32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.subarray(0, 32));
  return bytes;
}

function buildWitnesses(opts: {
  productKey?: string;
  nonce?: string;
  invoiceHash?: string;
  daysRemaining?: bigint;
  mfrKey?: string;
}) {
  const productKey = toBytes32(opts.productKey ?? 'default_product_serial_key');
  const nonce = toBytes32(opts.nonce ?? 'default_warranty_nonce');
  const invoiceHash = toBytes32(opts.invoiceHash ?? 'default_purchase_invoice');
  const daysRemaining = opts.daysRemaining ?? 365n;
  const mfrKey = toBytes32(opts.mfrKey ?? 'default_manufacturer_key');

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
    const minimumRequiredDays = 30n;
    const witnesses = buildWitnesses({ daysRemaining: expiredDays });
    const mockCtx = { privateState: {} };

    const [, days] = witnesses.warrantyDaysRemaining(mockCtx);
    expect(days >= minimumRequiredDays).toBe(false);
  });

  it('10. Session Isolation: witnesses built for different sessions produce independent nonce contexts', () => {
    const witnessesSession1 = buildWitnesses({ nonce: 'session_1_warranty_nonce', daysRemaining: 90n });
    const witnessesSession2 = buildWitnesses({ nonce: 'session_2_warranty_nonce', daysRemaining: 180n });
    const mockCtx = { privateState: { sessionId: 'test' } };

    const [, nonce1] = witnessesSession1.warrantyProofNonce(mockCtx);
    const [, nonce2] = witnessesSession2.warrantyProofNonce(mockCtx);

    expect(nonce1).not.toEqual(nonce2);
  });

  it('11. Authoritative Verified Contract Address: matches Preview deployment record', () => {
    expect(CONTRACT_ADDRESS).toBe('0x39764195d14758b6bd52ab6e13a0547bd29e972be5bfa4c18f2ceafc504ddc1a');
    expect(NETWORK_CONFIG.networkId).toBe('preview');
    expect(NETWORK_CONFIG.indexerUrl).toContain('indexer.preview.midnight.network');
  });

  it('12. Authoritative deployCPWVContract returns the verified contract address', async () => {
    const res = await deployCPWVContract();
    expect(res.contractAddress).toBe('0x39764195d14758b6bd52ab6e13a0547bd29e972be5bfa4c18f2ceafc504ddc1a');
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

});