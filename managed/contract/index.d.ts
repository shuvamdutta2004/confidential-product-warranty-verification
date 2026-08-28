import type * as __compactRuntime from "@midnight-ntwrk/compact-runtime";

// ── Ledger: 8 Public On-Chain Fields ────────────────────────────────────────
export type Ledger = {
  readonly claimCount: bigint;
  readonly revokedCount: bigint;
  readonly activeSession: bigint;
  readonly productId: Uint8Array;
  readonly manufacturerCommitment: Uint8Array;
  readonly lastClaimCommitment: Uint8Array;
  readonly lastRevokedCommitment: Uint8Array;
  readonly minimumRequiredDays: bigint;
};

// ── 5 Private Witnesses (never disclosed on-chain) ──────────────────────────
export type Witnesses<PS> = {
  productSecretKey(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  warrantyProofNonce(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  purchaseInvoiceHash(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  warrantyDaysRemaining(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  manufacturerSigningKey(ctx: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
};

// ── 6 Circuit Signatures ─────────────────────────────────────────────────────
export type ImpureCircuits<PS> = {
  claimWarranty(ctx: __compactRuntime.CircuitContext<PS>, expectedProductId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyWarranty(ctx: __compactRuntime.CircuitContext<PS>, claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeWarranty(ctx: __compactRuntime.CircuitContext<PS>, commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setManufacturerCommitment(ctx: __compactRuntime.CircuitContext<PS>, newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProduct(ctx: __compactRuntime.CircuitContext<PS>, newProductId_0: Uint8Array, newMinimumDays_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(ctx: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
};

export type ProvableCircuits<PS> = ImpureCircuits<PS>;
export type PureCircuits = Record<string, never>;
export type Circuits<PS> = ImpureCircuits<PS>;

export type ContractReferenceLocations = Record<string, never>;
export declare const contractReferenceLocations: ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(ctx: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
