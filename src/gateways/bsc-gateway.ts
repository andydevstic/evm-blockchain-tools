import { ethers, Signer, Wallet } from "ethers";
import Web3 from "web3";

import { BscGatewayConfig, IWeb3Gateway } from "../common/interfaces";

export class BscGateway implements IWeb3Gateway {
  protected web3: Web3;
  public provider: ethers.providers.JsonRpcProvider;
  public wallet: Wallet;

  constructor(protected config: BscGatewayConfig) {
    this.provider = new ethers.providers.JsonRpcProvider(this.config.httpsUrl, {
      name: this.config.networkName || "binance",
      chainId: this.config.chainId || 56,
    });
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(
      new ethers.Wallet(this.config.privateKey, this.provider)
    );
  }

  public async getBlock(blockNumber: number): Promise<any> {
    const block = await this.provider.getBlock(blockNumber);

    return block;
  }

  public async getSignerAddress(): Promise<string> {
    const signer = await this.signer;

    return signer.getAddress();
  }

  public getTransactionByID(txID: string): Promise<any> {
    return this.provider.getTransaction(txID);
  }
}
