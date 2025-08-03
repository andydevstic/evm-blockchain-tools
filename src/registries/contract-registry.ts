import { ContractModel } from "../models";
import { BLOCKCHAIN_CHAIN } from "../common/constants";
import { Signer } from "ethers";

export type ContractConstructor<T extends ContractModel> = (
  address: string,
  abi: any,
  signer: Signer
) => T;

export class ContractRegistry {
  protected registry: Map<string, any>;

  constructor() {}

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
    constructor: ContractConstructor<T>,
    address: string,
    network: BLOCKCHAIN_CHAIN,
    abi: any,
    signer: Signer
  ): Promise<void> {
    const signerAddress = await signer.getAddress();
    const hashKey = this.buildHashKey(network, address, signerAddress);
    if (this.registry.has(hashKey)) {
      return;
    }

    const contract = constructor(address, abi, signer);
    this.registry.set(hashKey, contract);
  }
}
