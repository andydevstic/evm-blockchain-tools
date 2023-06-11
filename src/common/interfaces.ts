import { Signer, ethers } from "ethers";

import { APP_NETWORK } from "./constants";
import { Options } from "reconnecting-websocket";

export interface AlchemyGatewayConfig {
  apiKey: string;
  network: APP_NETWORK;
  privateKey: string;
}

export interface WsGatewayConfig {
  wsUrl: string;
  options?: Options;
}

export interface Subscription {
  unsubscribe(): void;
}

export interface WsGatewayConfig {
  wsUrl: string;
  privateKey: string;
}

export interface BscWsGatewayConfig extends WsGatewayConfig {
  chainId?: number;
  network: APP_NETWORK;
}

export interface BscGatewayConfig {
  httpsUrl: string;
  privateKey: string;
  chainId?: number;
  network: APP_NETWORK;
}

export interface Waitable {
  wait(): Promise<void>;
}

export interface TronGatewayConfig {
  fullHostUrl: string;
  apiKey: string;
  privateKey: string;
}

export interface IWeb3Gateway {
  network: APP_NETWORK;
  signer: Promise<Signer>;
  provider?: any;
  getCurrentBlock(): Promise<number>;
  init?(): Promise<void>;
  getSignerAddress(): Promise<string>;
  getBlock(blockNumber: number): Promise<ethers.providers.Block>;
  getTransactionByID(
    txID: string
  ): Promise<ethers.providers.TransactionResponse>;
  recoverSigner(message: string, signedMessage: string): Promise<string>;
}
