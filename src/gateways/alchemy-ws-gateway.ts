import { Alchemy } from "alchemy-sdk";
import { Signer, Wallet, ethers } from "ethers";

import { AlchemyGatewayConfig, IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";

export class AlchemyWsGateway implements IWeb3Gateway {
  protected _alchemy: Alchemy;
  protected _provider: ethers.providers.AlchemyWebSocketProvider;
  public wallet: Wallet;

  constructor(protected config: AlchemyGatewayConfig) {
    this._alchemy = new Alchemy({
      apiKey: config.apiKey,
    });

    const alchemyProvider = new ethers.providers.AlchemyWebSocketProvider(
      config.network,
      config.apiKey
    );

    this.wallet = new Wallet(config.privateKey, alchemyProvider);

    this._provider = alchemyProvider;
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(this.wallet);
  }

  public get network(): APP_NETWORK {
    return this.config.network;
  }

  public getCurrentBlock(): Promise<number> {
    return this._provider.getBlockNumber();
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
