import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  productSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  warrantyProofNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  purchaseInvoiceHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  warrantyDaysRemaining(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  manufacturerSigningKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  claimWarranty(context: __compactRuntime.CircuitContext<PS>,
                expectedProductId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyWarranty(context: __compactRuntime.CircuitContext<PS>,
                 claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeWarranty(context: __compactRuntime.CircuitContext<PS>,
                 commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setManufacturerCommitment(context: __compactRuntime.CircuitContext<PS>,
                           newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProduct(context: __compactRuntime.CircuitContext<PS>,
               newProductId_0: Uint8Array,
               newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  claimWarranty(context: __compactRuntime.CircuitContext<PS>,
                expectedProductId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyWarranty(context: __compactRuntime.CircuitContext<PS>,
                 claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeWarranty(context: __compactRuntime.CircuitContext<PS>,
                 commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setManufacturerCommitment(context: __compactRuntime.CircuitContext<PS>,
                           newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProduct(context: __compactRuntime.CircuitContext<PS>,
               newProductId_0: Uint8Array,
               newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  claimWarranty(context: __compactRuntime.CircuitContext<PS>,
                expectedProductId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyWarranty(context: __compactRuntime.CircuitContext<PS>,
                 claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeWarranty(context: __compactRuntime.CircuitContext<PS>,
                 commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setManufacturerCommitment(context: __compactRuntime.CircuitContext<PS>,
                           newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProduct(context: __compactRuntime.CircuitContext<PS>,
               newProductId_0: Uint8Array,
               newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly claimCount: bigint;
  readonly revokedCount: bigint;
  readonly activeSession: bigint;
  readonly productId: Uint8Array;
  readonly manufacturerCommitment: Uint8Array;
  readonly lastClaimCommitment: Uint8Array;
  readonly lastRevokedCommitment: Uint8Array;
  readonly minimumRequiredDays: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;

