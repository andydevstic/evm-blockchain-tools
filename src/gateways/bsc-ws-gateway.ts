import { ethers, Signer, Wallet } from "ethers";
import Ws from "ws";
import ReconnectingWebSocket from "reconnecting-websocket";

import {
  BscWsGatewayConfig,
  IWeb3Gateway,
  WsGatewayConfig,
} from "../common/interfaces";
import { APP_NETWORK, NETWORK_IDS } from "../common/constants";

export class BscWsGateway implements IWeb3Gateway {
  public provider: ethers.providers.WebSocketProvider;
  public wallet: Wallet;

  constructor(protected config: WsGatewayConfig & BscWsGatewayConfig) {
    const wsClient = new ReconnectingWebSocket(config.wsUrl, [], {
      WebSocket: Ws,
      ...(config.options || {}),
    });

    this.provider = new ethers.providers.WebSocketProvider(wsClient, {
      name: this.config.network || APP_NETWORK.BINANCE,
      chainId: this.config.chainId || NETWORK_IDS.BINANCE,
    });
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(
      new ethers.Wallet(this.config.privateKey, this.provider)
    );
  }

  public get network(): APP_NETWORK {
    return this.config.network;
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
