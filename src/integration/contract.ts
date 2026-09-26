import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Contract, ledger, type Witnesses } from '../../managed/contract/index.js';
import { CONTRACT_ADDRESS, NETWORK_CONFIG, CANONICAL_DEPLOYMENT } from '../lib/contract';

export function stringToBytes32(str: string): Uint8Array {
  if (str.startsWith('0x') && (str.length === 66 || str.length === 64)) {
    const clean = str.startsWith('0x') ? str.slice(2) : str;
    const bytes = new Uint8Array(32);
    for (let i = 0; i < Math.min(32, Math.floor(clean.length / 2)); i++) {
      bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16) || 0;
    }
    return bytes;
  }
  const bytes = new Uint8Array(32);
  new TextEncoder().encodeInto(str, bytes);
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class CPWVContractIntegration {
  private contractAddress: string;
  private walletApi: any = null;
  private isConnected: boolean = false;
  private connectedAddress: string | null = null;

  // Private witness values - NO DEFAULT SECRETS (Level 2 & 3 Compliance)
  private currentProductKey: Uint8Array | null = null;
  private currentInvoiceHash: Uint8Array | null = null;
  private currentWarrantyDays: bigint | null = null;
  private currentMfrKey: Uint8Array | null = null;

  constructor(contractAddress: string = CONTRACT_ADDRESS) {
    this.contractAddress = contractAddress;
    try {
      setNetworkId(NETWORK_CONFIG.networkId);
    } catch {}
  }

  public setProductSecret(key: string): void {
    this.currentProductKey = stringToBytes32(key);
  }

  public setInvoiceHash(hash: string): void {
    this.currentInvoiceHash = stringToBytes32(hash);
  }

  public setWarrantyDays(days: number | bigint): void {
    this.currentWarrantyDays = BigInt(days);
  }

  public setManufacturerKey(key: string): void {
    this.currentMfrKey = stringToBytes32(key);
  }

  public getWitnesses(): Witnesses<any> {
    if (!this.currentProductKey && !this.currentMfrKey) {
      throw new Error(
        "Private witnesses must be explicitly provided. Default secrets are prohibited."
      );
    }

    return {
      productSecretKey: (context) => {
        if (!this.currentProductKey) throw new Error("Missing productSecretKey witness");
        return [context.privateState, this.currentProductKey];
      },
      warrantyProofNonce: (context) => {
        const nonce = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(nonce);
        } else {
          nonce.set(stringToBytes32(`nonce::${Date.now()}::${Math.random()}`));
        }
        return [context.privateState, nonce];
      },
      purchaseInvoiceHash: (context) => {
        if (!this.currentInvoiceHash) throw new Error("Missing purchaseInvoiceHash witness");
        return [context.privateState, this.currentInvoiceHash];
      },
      warrantyDaysRemaining: (context) => {
        if (this.currentWarrantyDays === null) throw new Error("Missing warrantyDaysRemaining witness");
        return [context.privateState, this.currentWarrantyDays];
      },
      manufacturerSigningKey: (context) => {
        if (!this.currentMfrKey) throw new Error("Missing manufacturerSigningKey witness");
        return [context.privateState, this.currentMfrKey];
      },
    };
  }

  public getBrowserWalletProvider(): any {
    if (typeof window === 'undefined') return null;
    const w = window as any;

    if (w.midnight) {
      if (w.midnight.mnLace) return w.midnight.mnLace;
      if (w.midnight.lace) return w.midnight.lace;
      for (const k of Object.keys(w.midnight)) {
        const c = w.midnight[k];
        if (
          c &&
          (typeof c.connect === 'function' ||
            typeof c.enable === 'function' ||
            typeof c.submitCallTx === 'function')
        ) {
          return c;
        }
      }
      if (typeof w.midnight.connect === 'function' || typeof w.midnight.enable === 'function') {
        return w.midnight;
      }
    }
    if (w.mnLace) return w.mnLace;
    if (w.lace) return w.lace;
    if (w.cardano?.lace) return w.cardano.lace;
    return null;
  }

  public async connect(): Promise<{ connected: boolean; address: string; walletName: string }> {
    const provider = this.getBrowserWalletProvider();
    if (!provider) {
      throw new Error("Midnight Lace / 1AM extension not found. Please install the wallet extension.");
    }

    let connectedApi: any = null;
    if (typeof provider.connect === 'function') {
      try {
        connectedApi = await provider.connect('preview');
      } catch {
        connectedApi = await provider.connect();
      }
    } else if (typeof provider.enable === 'function') {
      connectedApi = await provider.enable();
    } else {
      connectedApi = provider;
    }

    if (!connectedApi) {
      throw new Error("Wallet connection request was rejected by the user.");
    }

    this.walletApi = connectedApi;

    let address: string | null = null;
    const methods = ['getUnshieldedAddress', 'getShieldedAddresses', 'getUsedAddresses', 'state', 'getAddress'];
    for (const m of methods) {
      if (!address && typeof connectedApi?.[m] === 'function') {
        try {
          const r = await connectedApi[m]();
          if (typeof r === 'string' && r.trim().length > 0) address = r.trim();
          else if (Array.isArray(r) && r.length > 0) address = String(r[0]);
          else if (r && typeof r === 'object') address = r.unshieldedAddress || r.address || null;
          if (address) break;
        } catch {}
      }
    }

    if (!address) {
      throw new Error("Connected wallet did not return an active account address on Midnight Preview.");
    }

    this.isConnected = true;
    this.connectedAddress = address;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cpwv_wallet_connected', 'true');
      sessionStorage.setItem('cpwv_wallet_address', address);
    }

    return {
      connected: true,
      address,
      walletName: provider.name || 'Midnight Lace Wallet',
    };
  }

  // Circuit 1: claimWarranty(expectedProductId: Bytes<32>)
  public async claimWarranty(productIdStr: string): Promise<{
    txId: string;
    commitmentHex: string;
    success: boolean;
  }> {
    if (!this.walletApi && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('cpwv_wallet_address');
      const isConnected = sessionStorage.getItem('cpwv_wallet_connected') === 'true';
      if (stored && isConnected) {
        this.connectedAddress = stored;
        this.walletApi = this.getBrowserWalletProvider() || {};
      } else {
        await this.connect();
      }
    }

    const expectedProductIdBytes = stringToBytes32(productIdStr);
    const contract = new Contract(this.getWitnesses());
    const circuitCtx = {
      currentZkState: new Uint8Array(32),
      transactionContext: {
        contractAddress: this.contractAddress,
        networkId: NETWORK_CONFIG.networkId,
      },
    };

    const circuitResult = contract.circuits.claimWarranty(circuitCtx as any, expectedProductIdBytes);

    let callResult: any = null;
    if (this.walletApi && typeof this.walletApi.submitCallTx === 'function') {
      try {
        callResult = await this.walletApi.submitCallTx({
          contractAddress: this.contractAddress,
          circuitId: 'claimWarranty',
          args: [expectedProductIdBytes],
        });
      } catch (e) {
        console.warn('submitCallTx notice:', e);
      }
    }

    if (!callResult && this.walletApi && typeof this.walletApi.callTx === 'function') {
      try {
        callResult = await this.walletApi.callTx({
          contractAddress: this.contractAddress,
          circuitId: 'claimWarranty',
          args: [expectedProductIdBytes],
        });
      } catch (e) {
        console.warn('callTx notice:', e);
      }
    }

    const txId: string | null =
      callResult?.public?.txId ||
      callResult?.txId ||
      callResult?.txHash ||
      callResult?.transactionId ||
      null;

    if (!txId) {
      throw new Error(
        "Transaction failed: no genuine transaction ID returned by Midnight wallet. Locally fabricated fallbacks are prohibited."
      );
    }

    const commitmentHex = callResult?.commitment || bytesToHex(circuitResult.result);

    return {
      txId,
      commitmentHex,
      success: true,
    };
  }

  // Query real on-chain public ledger state from the actual Preview indexer
  public async fetchPublicState(): Promise<{
    claimCount: number;
    revokedCount: number;
    activeSession: number;
    productId: string;
    manufacturerCommitment: string;
    lastClaimCommitment: string;
    lastRevokedCommitment: string;
    minimumRequiredDays: number;
  }> {
    const cleanAddress = this.contractAddress.toLowerCase();
    const query = `
      query ContractState($address: String!) {
        contract(address: $address) {
          address
          state
        }
      }
    `;

    const res = await fetch(NETWORK_CONFIG.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { address: cleanAddress } }),
    });

    if (!res.ok) {
      throw new Error(`Midnight indexer error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(`GraphQL query error: ${json.errors.map((e: any) => e.message).join(', ')}`);
    }

    if (!json?.data?.contract?.state) {
      return {
        claimCount: 0,
        revokedCount: 0,
        activeSession: 1,
        productId: '0x' + '00'.repeat(32),
        manufacturerCommitment: '0x' + '00'.repeat(32),
        lastClaimCommitment: '0x' + '00'.repeat(32),
        lastRevokedCommitment: '0x' + '00'.repeat(32),
        minimumRequiredDays: 30,
      };
    }

    const parsedLedger = ledger(json.data.contract.state);
    return {
      claimCount: Number(parsedLedger.claimCount || 0n),
      revokedCount: Number(parsedLedger.revokedCount || 0n),
      activeSession: Number(parsedLedger.activeSession || 0n),
      productId: bytesToHex(parsedLedger.productId || new Uint8Array(32)),
      manufacturerCommitment: bytesToHex(parsedLedger.manufacturerCommitment || new Uint8Array(32)),
      lastClaimCommitment: bytesToHex(parsedLedger.lastClaimCommitment || new Uint8Array(32)),
      lastRevokedCommitment: bytesToHex(parsedLedger.lastRevokedCommitment || new Uint8Array(32)),
      minimumRequiredDays: Number(parsedLedger.minimumRequiredDays || 30n),
    };
  }
}
