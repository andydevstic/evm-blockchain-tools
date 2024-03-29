import { ethers, Signer, Wallet } from "ethers";
import Ws from "ws";
import { hashMessage } from "@ethersproject/hash";
import ReconnectingWebSocket from "reconnecting-websocket";

import {
  BscWsGatewayConfig,
  IWeb3Gateway,
  WsGatewayConfig,
} from "../common/interfaces";
import { APP_NETWORK, NETWORK_IDS } from "../common/constants";
import { isValidEvmTxFormat } from "../utils";

export class BscWsGateway implements IWeb3Gateway {
  public provider: ethers.providers.WebSocketProvider;
  public wallet: Wallet;
  public network = APP_NETWORK.BINANCE;

  constructor(protected config: WsGatewayConfig & BscWsGatewayConfig) {
    const wsClient = new ReconnectingWebSocket(config.wsUrl, [], {
      WebSocket: Ws,
      ...(config.options || {}),
    });

    const name =
      this.config.network === APP_NETWORK.BINANCE
        ? APP_NETWORK.BINANCE
        : APP_NETWORK.BINANCE_TESTNET;
    const chainId =
      this.config.network === APP_NETWORK.BINANCE
        ? NETWORK_IDS.BINANCE
        : NETWORK_IDS.BINANCE_TESTNET;

    this.provider = new ethers.providers.WebSocketProvider(wsClient, {
      name,
      chainId,
    });
  }

  public async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();

    return gasPrice.toString();
  }

  public isValidTxFormat(txHash: string): boolean {
    return isValidEvmTxFormat(txHash);
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
