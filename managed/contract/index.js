import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export class Contract {
  witnesses;
  circuits;
  impureCircuits;
  provableCircuits;

  constructor(witnesses) {
    if (typeof witnesses !== 'object' || witnesses === null) {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof witnesses.productSecretKey !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named productSecretKey');
    }
    if (typeof witnesses.warrantyProofNonce !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named warrantyProofNonce');
    }
    if (typeof witnesses.purchaseInvoiceHash !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named purchaseInvoiceHash');
    }
    if (typeof witnesses.warrantyDaysRemaining !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named warrantyDaysRemaining');
    }
    if (typeof witnesses.manufacturerSigningKey !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named manufacturerSigningKey');
    }

    this.witnesses = witnesses;

    const self = this;
    this.circuits = {
      claimWarranty(context, expectedProductId) {
        return { result: expectedProductId, context };
      },
      verifyWarranty(context, claimedCommitment) {
        return { result: true, context };
      },
      revokeWarranty(context, commitmentToRevoke) {
        return { result: commitmentToRevoke, context };
      },
      setManufacturerCommitment(context, newMinimumDays) {
        return { result: new Uint8Array(32), context };
      },
      resetProduct(context, newProductId, newMinimumDays) {
        return { result: newProductId, context };
      },
      incrementSession(context) {
        return { result: [], context };
      }
    };
    this.impureCircuits = this.circuits;
    this.provableCircuits = this.circuits;
  }

  initialState(context) {
    return { context };
  }
}

export function ledger(stateOrChargedState) {
  return {
    claimCount: 0n,
    revokedCount: 0n,
    activeSession: 0n,
    productId: new Uint8Array(32),
    manufacturerCommitment: new Uint8Array(32),
    lastClaimCommitment: new Uint8Array(32),
    lastRevokedCommitment: new Uint8Array(32),
    minimumRequiredDays: 30n,
  };
}

export const pureCircuits = {};
export const contractReferenceLocations = { tag: 'publicLedgerArray', indices: {} };

