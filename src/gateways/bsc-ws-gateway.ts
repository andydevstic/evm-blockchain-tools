import { ethers, Signer, Wallet } from "ethers";
import Web3 from "web3";

import { BscWsGatewayConfig, IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";

export class BscWsGateway implements IWeb3Gateway {
  protected web3: Web3;
  public provider: ethers.providers.WebSocketProvider;
  public wallet: Wallet;

  constructor(protected config: BscWsGatewayConfig) {
    this.provider = new ethers.providers.WebSocketProvider(this.config.wsUrl, {
      name: this.config.networkName || "binance",
      chainId: this.config.chainId || 56,
    });
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(
      new ethers.Wallet(this.config.privateKey, this.provider)
    );
  }

  public get network(): APP_NETWORK {
    return APP_NETWORK.BINANCE;
  }

  public async getBlock(blockNumber: number): Promise<any> {
    const block = await this.provider.getBlock(blockNumber);

    return block;
  }

  public getCurrentBlock(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  public async getSignerAddress(): Promise<string> {
    const signer = await this.signer;

    return signer.getAddress();
  }

  public getTransactionByID(txID: string): Promise<any> {
    return this.provider.getTransaction(txID);
  }
}
