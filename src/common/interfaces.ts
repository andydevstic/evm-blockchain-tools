import { BigNumber, Signer, ethers } from "ethers";

import { ALCHEMY_NETWORK, APP_NETWORK, MULTISIG_TX_STATUS } from "./constants";
import { Options } from "reconnecting-websocket";

export interface AlchemyGatewayConfig {
  apiKey: string;
  network?: ALCHEMY_NETWORK;
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

export interface MultisigTxStatus {
  status: MULTISIG_TX_STATUS;
  transactionHash?: string;
}

export interface TransferAmountData {
  amount?: string;
  contractAddress: string;
  tolerancePercentage?: number;
}

export interface TransferValidationData {
  userAddress: string;
  destinationAddress: string;
  amountData: TransferAmountData[];
  signature: string;
  signContent: string;
  minConfirmations: number;
}

export interface TransferValidationResult {
  isValid: boolean;
  message?: string;
  code?: string;
  data?: {
    amountData: TransferAmountData;
  };
}

export interface BscWsGatewayConfig extends WsGatewayConfig {
  chainId?: number;
  network: APP_NETWORK;
}

export interface ContractTxOption {
  gasPrice?: string;
  gasLimit?: string;
  maxPriorityFeePerGas?: BigNumber;
  maxFeePerGas?: BigNumber;
}

export interface EvmGatewayConfig {
  httpsUrl: string;
  privateKey: string;
  chainId: number;
  name: string;
}

export interface BscGatewayConfig {
  httpsUrl: string;
  privateKey: string;
  chainId?: number;
  network?: APP_NETWORK;
}

export interface Waitable {
  wait(
    confirmations?: number,
    timeoutInMs?: number
  ): Promise<TransactionResponse>;
  hash: string;
}

export interface TransactionResponse {
  transactionHash: string;
  confirmations: number;
  to: string;
  from: string;
}

export interface TronGatewayConfig {
  fullHostUrl: string;
  apiKey: string;
  privateKey: string;
}

export interface IERC20Service {
  abiInterface: any;
  balanceOf(address: string): Promise<string>;
  transfer(address: string, amount: string): Promise<TransactionResponse>;
  mint(address: string, amount: string): Promise<void>;
  burn(amount: string): Promise<void>;
  burnFrom(address: string, amount: string): Promise<void>;
}

export interface IERC20ServiceFactory {
  createERC20Service(address: string, signer: Signer, abi?: any): IERC20Service;
  createTRC20Service(address: string, signer: Signer, abi?: any): IERC20Service;
}

export interface IWeb3GatewayFactory {
  createAlchemyProvider(
    apiKey: string,
    privateKey: string,
    network?: ALCHEMY_NETWORK
  ): IWeb3Gateway;

  createQuicknodeProvider(
    quickNodeHttpsURL: string,
    privateKey: string,
    network?: APP_NETWORK
  ): IWeb3Gateway;

  createTronProvider(
    fullHostURL: string,
    apiKey: string,
    privateKey: string
  ): IWeb3Gateway;
}

export interface IWeb3Gateway {
  network: APP_NETWORK;
  signer: Promise<Signer>;
  provider?: any;
  connect(): void;
  getCurrentBlock(): Promise<number>;
  getGasPrice(): Promise<string>;
  init?(): Promise<void>;
  getSignerAddress(): Promise<string>;
  getBlock(blockNumber: number): Promise<ethers.providers.Block>;
  isValidTxFormat(txHash: string): boolean;
  getTransactionByID(
    txID: string
  ): Promise<ethers.providers.TransactionResponse>;
  recoverSigner(message: string, signedMessage: string): Promise<string>;
}
