import { ContractModel } from "../models";
import { BLOCKCHAIN_CHAIN } from "../common/constants";

export class ContractRegistry {
  protected registry: Map<string, any> = new Map();

  protected buildHashKey(
    network: BLOCKCHAIN_CHAIN,
    address: string,
    signerName: string
  ): string {
    return `${network}_${address}_${signerName}`;
  }

  public getContract<T extends ContractModel>(
    network: BLOCKCHAIN_CHAIN,
    address: string,
    signerName: string
  ): T | null {
    const hashKey = this.buildHashKey(network, address, signerName);
    if (this.registry.has(hashKey)) {
      return this.registry.get(hashKey);
    }

    return null;
  }

  public async registerContract<T extends ContractModel>(
    contract: T,
    network: BLOCKCHAIN_CHAIN,
    signerName: string
  ): Promise<void> {
    const address = contract.address;

    const hashKey = this.buildHashKey(network, address, signerName);
    if (this.registry.has(hashKey)) {
      return;
    }

    this.registry.set(hashKey, contract);
  }
}
