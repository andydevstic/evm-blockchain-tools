import { Alchemy } from "alchemy-sdk";
import Ws from "ws";
import ReconnectingWebSocket from "reconnecting-websocket";
import { hashMessage } from "@ethersproject/hash";
import { Signer, Wallet, ethers } from "ethers";

import {
  AlchemyGatewayConfig,
  IWeb3Gateway,
  WsGatewayConfig,
} from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";
import { isValidEvmTxFormat } from "../utils";

export class AlchemyWsGateway implements IWeb3Gateway {
  protected _alchemy: Alchemy;
  protected _provider: ethers.providers.WebSocketProvider;
  public wallet: Wallet;
  public network = APP_NETWORK.ETH;

  constructor(protected config: WsGatewayConfig & AlchemyGatewayConfig) {
    this._alchemy = new Alchemy({
      apiKey: config.apiKey,
    });

    const wsClient = new ReconnectingWebSocket(config.wsUrl, [], {
      WebSocket: Ws,
      ...(config.options || {}),
    });

    const alchemyProvider = new ethers.providers.WebSocketProvider(
      wsClient,
      config.apiKey
    );

    this.wallet = new Wallet(config.privateKey, alchemyProvider);

    this._provider = alchemyProvider;
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(this.wallet);
  }

  public getCurrentBlock(): Promise<number> {
    return this._provider.getBlockNumber();
  }

  public isValidTxFormat(txHash: string): boolean {
    return isValidEvmTxFormat(txHash);
  }

  public async recoverSigner(
    message: string,
    signedMessage: string
  ): Promise<string> {
    return ethers.utils.recoverAddress(hashMessage(message), signedMessage);
  }

  public getBlock(blockNumber: number) {
    return this._provider.getBlock(blockNumber);
  }

  public async getGasPrice(): Promise<string> {
    const gasPrice = await this._provider.getGasPrice();

    return gasPrice.toString();
  }

  public getSignerAddress(): Promise<string> {
    return this.wallet.getAddress();
  }

  public getTransactionByID(txID: string): Promise<any> {
    return this._provider.getTransaction(txID);
  }
}
