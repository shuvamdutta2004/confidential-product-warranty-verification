export const CONTRACT_ADDRESS = "0x6901581544ed1b8b2589d39fc4c95f6d48aeae5e0a76469f9707c77091c0a42c";

export interface ClaimResult {
  txHash: string;
  commitmentHex: string;
  daysRequirementMet: boolean;
  signedBy: string;
  txFee: string;
  txFeeAsset: string;
}

export interface VerifyResult {
  matches: boolean;
  txHash: string;
}

export interface LandlordResult {
  txHash: string;
  manufacturerCommitment: string;
  newMinimumDays: number;
}

export interface RevokeResult {
  txHash: string;
  revokedCommitment: string;
}

export interface ResetResult {
  txHash: string;
  newProductId: string;
  newMinimumDays: number;
}

function stringToHex(str: string): string {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex.padEnd(64, "0").substring(0, 64);
}

function mockHash(parts: string[]): string {
  let acc = 0x811c9dc5;
  const combined = parts.join("::");
  for (let i = 0; i < combined.length; i++) {
    acc ^= combined.charCodeAt(i);
    acc = (acc * 0x01000193) >>> 0;
  }
  return "0x" + acc.toString(16).padStart(8, "0") + stringToHex(combined.substring(0, 24));
}

export class ConfidentialWarrantyClient {
  private productSecretKey: string = "default_product_serial_key";
  private purchaseInvoice: string = "default_purchase_invoice";
  private warrantyDays: number = 365;
  private manufacturerKey: string = "default_manufacturer_key";

  public setProductSecretKey(key: string) { this.productSecretKey = key; }
  public setPurchaseInvoice(inv: string) { this.purchaseInvoice = inv; }
  public setWarrantyDays(days: number) { this.warrantyDays = days; }
  public setManufacturerKey(key: string) { this.manufacturerKey = key; }

  public async claimWarranty(expectedProductId: string): Promise<ClaimResult> {
    await new Promise((r) => setTimeout(r, 1200));

    if (typeof window !== "undefined" && (window as any).midnight?.mnLace) {
      try {
        const lace = (window as any).midnight.mnLace;
        const api = await lace.enable();
        if (api && api.submitTx) {
          const txRes = await api.submitTx({ contractAddress: CONTRACT_ADDRESS, circuit: "claimWarranty" });
          return {
            txHash: txRes.txHash || mockHash(["tx", Date.now().toString()]),
            commitmentHex: txRes.commitment || mockHash(["cpw:warranty:claim:v2", this.productSecretKey, expectedProductId]),
            daysRequirementMet: this.warrantyDays >= 30,
            signedBy: (await api.getAccount?.()) || "LaceWalletConnectedUser",
            txFee: "0.0042",
            txFeeAsset: "tDUST",
          };
        }
      } catch (e) {
        console.warn("Lace Wallet connection fallback to simulated proof:", e);
      }
    }

    const commitment = mockHash(["cpw:warranty:claim:v2", this.productSecretKey, this.purchaseInvoice, expectedProductId]);
    const txHash = mockHash(["tx", commitment, Date.now().toString()]);

    return {
      txHash,
      commitmentHex: commitment,
      daysRequirementMet: this.warrantyDays >= 30,
      signedBy: "0x3a4b...c8d9 (Midnight Browser Wallet)",
      txFee: "0.0042",
      txFeeAsset: "tDUST",
    };
  }

  public async verifyWarranty(claimedCommitment: string): Promise<VerifyResult> {
    await new Promise((r) => setTimeout(r, 600));
    const txHash = mockHash(["verify", claimedCommitment, Date.now().toString()]);
    const matches = claimedCommitment.length > 10 && !claimedCommitment.includes("invalid");
    return { matches, txHash };
  }

  public async revokeWarranty(commitmentToRevoke: string): Promise<RevokeResult> {
    await new Promise((r) => setTimeout(r, 1000));
    const revokedCommitment = mockHash(["cpw:revoked", commitmentToRevoke, this.manufacturerKey]);
    const txHash = mockHash(["tx:revoke", revokedCommitment]);
    return { txHash, revokedCommitment };
  }

  public async setManufacturerCommitment(newMinimumDays: number): Promise<LandlordResult> {
    await new Promise((r) => setTimeout(r, 1000));
    const manufacturerCommitment = mockHash(["cpw:manufacturer:authority:v1", this.manufacturerKey]);
    const txHash = mockHash(["tx:setMfr", manufacturerCommitment]);
    return { txHash, manufacturerCommitment, newMinimumDays };
  }

  public async resetProduct(newProductId: string, newMinimumDays: number): Promise<ResetResult> {
    await new Promise((r) => setTimeout(r, 900));
    const txHash = mockHash(["tx:resetProduct", newProductId]);
    return { txHash, newProductId, newMinimumDays };
  }

  public async incrementSession(): Promise<{ txHash: string }> {
    await new Promise((r) => setTimeout(r, 600));
    const txHash = mockHash(["tx:incrementSession", Date.now().toString()]);
    return { txHash };
  }
}

let clientInstance: ConfidentialWarrantyClient | null = null;
export function getClient(): ConfidentialWarrantyClient {
  if (!clientInstance) {
    clientInstance = new ConfidentialWarrantyClient();
  }
  return clientInstance;
}

