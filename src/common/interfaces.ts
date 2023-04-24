import { Signer, ethers } from "ethers";
import { APP_NETWORK } from "./constants";

export interface AlchemyGatewayConfig {
  apiKey: string;
  network: APP_NETWORK;
  privateKey: string;
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
  networkName?: string;
}

export interface BscGatewayConfig {
  httpsUrl: string;
  privateKey: string;
  chainId?: number;
  networkName?: string;
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
  signer: Promise<Signer>;
  provider?: any;
  init?(): Promise<void>;
  getSignerAddress(): Promise<string>;
  getBlock(blockNumber: number): Promise<ethers.providers.Block>;
  getTransactionByID(
    txID: string
  ): Promise<ethers.providers.TransactionResponse>;
}
