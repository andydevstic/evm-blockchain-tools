import { ethers, Signer, Wallet } from "ethers";
import Web3 from "web3";
import { hashMessage } from "@ethersproject/hash";

import { BscGatewayConfig, IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK, NETWORK_IDS } from "../common/constants";

export class BscGateway implements IWeb3Gateway {
  protected web3: Web3;
  public provider: ethers.providers.JsonRpcProvider;
  public wallet: Wallet;
  public network = APP_NETWORK.BINANCE;

  constructor(protected config: BscGatewayConfig) {
    this.provider = new ethers.providers.JsonRpcProvider(this.config.httpsUrl, {
      name: this.config.network || APP_NETWORK.BINANCE,
      chainId: this.config.chainId || NETWORK_IDS.BINANCE,
    });
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(
      new ethers.Wallet(this.config.privateKey, this.provider)
    );
  }

  public async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();

    return gasPrice.toString();
  }

  public async getBlock(blockNumber: number): Promise<any> {
    const block = await this.provider.getBlock(blockNumber);

    return block;
  }

  public async recoverSigner(
    message: string,
    signedMessage: string
  ): Promise<string> {
    return ethers.utils.recoverAddress(hashMessage(message), signedMessage);
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
