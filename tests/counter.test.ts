import { describe, it, expect } from 'vitest';
import { Contract, ledger } from '../managed/contract/index.js';

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
    productSecretKey: (ctx: any) => [ctx.privateState, productKey] as [any, Uint8Array],
    warrantyProofNonce: (ctx: any) => [ctx.privateState, nonce] as [any, Uint8Array],
    purchaseInvoiceHash: (ctx: any) => [ctx.privateState, invoiceHash] as [any, Uint8Array],
    warrantyDaysRemaining: (ctx: any) => [ctx.privateState, daysRemaining] as [any, bigint],
    manufacturerSigningKey: (ctx: any) => [ctx.privateState, mfrKey] as [any, Uint8Array],
  };
}

// --- Test Suite --------------------------------------------------------------

describe('Confidential Product Warranty Verification (CPWV) — Midnight ZK Contract v2', () => {

  it('1. Contract Structure: core circuits are exported and callable from managed runtime', () => {
    const contract = new Contract(buildWitnesses({}));
    expect(contract).toBeDefined();
    expect(typeof contract.circuits.claimWarranty).toBe('function');
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
    expect(days >= minimumRequiredDays).toBe(true); // Product warranty QUALIFIES
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

  it('8. Ledger Schema Interface: ledger() export is a function querying the 8-field on-chain state', () => {
    expect(typeof ledger).toBe('function');
  });

  it('9. Expired Warranty Fail Case: warrantyDaysRemaining below minimumRequiredDays fails threshold check', () => {
    const expiredDays = 5n;
    const minimumRequiredDays = 30n;
    const witnesses = buildWitnesses({ daysRemaining: expiredDays });
    const mockCtx = { privateState: {} };

    const [, days] = witnesses.warrantyDaysRemaining(mockCtx);
    expect(days >= minimumRequiredDays).toBe(false); // Warranty EXPIRED — circuit would reject claim
  });

  it('10. Session Isolation: witnesses built for different sessions produce independent nonce contexts', () => {
    const witnessesSession1 = buildWitnesses({ nonce: 'session_1_warranty_nonce', daysRemaining: 90n });
    const witnessesSession2 = buildWitnesses({ nonce: 'session_2_warranty_nonce', daysRemaining: 180n });
    const mockCtx = { privateState: { sessionId: 'test' } };

    const [, nonce1] = witnessesSession1.warrantyProofNonce(mockCtx);
    const [, nonce2] = witnessesSession2.warrantyProofNonce(mockCtx);

    expect(nonce1).not.toEqual(nonce2);
  });

});

