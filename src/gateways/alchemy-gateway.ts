import { Alchemy } from "alchemy-sdk";
import { Signer, Wallet, ethers } from "ethers";
import { hashMessage } from "@ethersproject/hash";

import { AlchemyGatewayConfig, IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";
import { isValidEvmTxFormat } from "../utils";

export class AlchemyGateway implements IWeb3Gateway {
  protected _alchemy: Alchemy;
  protected _provider: ethers.providers.AlchemyProvider;
  public wallet: Wallet;
  public network = APP_NETWORK.ETH;

  constructor(protected config: AlchemyGatewayConfig) {
    this._alchemy = new Alchemy({
      apiKey: config.apiKey,
    });

    const alchemyProvider = new ethers.providers.AlchemyProvider(
      config.network,
      config.apiKey
    );

    this.wallet = new Wallet(config.privateKey, alchemyProvider);

    this._provider = alchemyProvider;
  }

  public async getGasPrice(): Promise<string> {
    const gasPrice = await this._provider.getGasPrice();

    return gasPrice.toString();
  }

  public async recoverSigner(
    message: string,
    signedMessage: string
  ): Promise<string> {
    return ethers.utils.recoverAddress(hashMessage(message), signedMessage);
  }

  public ixValidTxFormat(txHash: string): boolean {
    return isValidEvmTxFormat(txHash);
  }

  public getCurrentBlock(): Promise<number> {
    return this._provider.getBlockNumber();
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(this.wallet);
  }

  public getBlock(blockNumber: number) {
    return this._provider.getBlock(blockNumber);
  }

  public getSignerAddress(): Promise<string> {
    return this.wallet.getAddress();
  }

  public getTransactionByID(txID: string): Promise<any> {
    return this._provider.getTransaction(txID);
  }
}
