import { ethers } from "ethers";
import Safe from "@safe-global/safe-core-sdk";
import EthersAdapter from "@safe-global/safe-ethers-lib";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";
import axios from "axios";
import SafeServiceClient, {
  SafeMultisigTransactionListResponse,
} from "@safe-global/safe-service-client";

import { IWeb3Gateway, MultisigTxStatus } from "../common/interfaces";
import {
  APP_NETWORK,
  EMPTY_ADDRESS,
  MULTISIG_TX_STATUS,
} from "../common/constants";
import { encodeFunctionSignature } from "../utils/web3-utils";

export class MultisigService {
  protected isInitialized = false;

  protected adapter: EthersAdapter;
  protected serviceClient: SafeServiceClient;

  constructor(protected provider: IWeb3Gateway) {}

  public async init(): Promise<void> {
    const signer = await this.provider.signer;

    this.adapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    });

    this.serviceClient = new SafeServiceClient({
      txServiceUrl: this.serviceNetworkUrl,
      ethAdapter: this.adapter,
    });

    this.isInitialized = true;
  }

  protected ensureInit(): void {
    if (!this.isInitialized) {
      throw new Error("service not initialized");
    }
  }

  public getSafeByAddress(safeAddress: string): Promise<Safe> {
    this.ensureInit();

    return Safe.create({
      ethAdapter: this.adapter,
      safeAddress: safeAddress,
    });
  }

  protected get serviceNetworkUrl() {
    switch (this.provider.network) {
      case APP_NETWORK.ETH:
        return "https://safe-transaction-mainnet.safe.global";
      case APP_NETWORK.BINANCE:
        return "https://safe-transaction-bsc.safe.global";
      case APP_NETWORK.GOERLI:
        return "https://safe-transaction-goerli.safe.global";
      case APP_NETWORK.BINANCE_TESTNET:
        throw new Error("service for binance testnet is not supported");
    }
  }

  public async checkTxStatus(
    multisigAddress: string,
    internalHash: string
  ): Promise<MultisigTxStatus> {
    const txData = await this.getTransaction(internalHash);

    // Tx executed successfully
    if (txData.isExecuted && txData.isSuccessful && txData.dataDecoded) {
      return {
        status: MULTISIG_TX_STATUS.EXECUTED,
        transactionHash: txData.transactionHash,
      };
    }

    const txByNonce = await this.getTxByNonce(multisigAddress, txData.nonce);

    // Tx is still pending
    if (txByNonce.results?.length === 1) {
      return {
        status: MULTISIG_TX_STATUS.PENDING,
      };
    }

    const executedRejectionTx = txByNonce.results.find(
      (tx) => tx.isExecuted && tx.isSuccessful && !tx.dataDecoded
    );

    // Found rejection tx and is executed
    if (executedRejectionTx) {
      return {
        status: MULTISIG_TX_STATUS.REJECTED,
      };
    }

    // Rejection tx submitted but not yet approved
    return {
      status: MULTISIG_TX_STATUS.PENDING,
    };
  }

  public async getTxByNonce(
    multisigAddress: string,
    nonce: number
  ): Promise<SafeMultisigTransactionListResponse> {
    const response = await axios.get(
      `${this.serviceNetworkUrl}/api/v1/safes/${multisigAddress}/multisig-transactions?nonce=${nonce}`
    );

    if (response.status === 200) {
      return response.data;
    }

    throw new Error("failed to get tx by nonce");
  }

  /**
   * Gets all pending transactions of a safe
   * @param multisigAddress The multisig address
   * @param endingNonce The nonce to start the search onwards
   * @returns
   */
  public getPendingTransactions(multisigAddress: string, endingNonce: number) {
    return this.serviceClient.getPendingTransactions(
      multisigAddress,
      endingNonce
    );
  }

  protected async proposeTx(
    multisigAddress: string,
    data: SafeTransactionDataPartial & {
      sender: string;
      signature: string;
      origin: string;
      contractTransactionHash: string;
    }
  ): Promise<void> {
    const url = `${this.serviceNetworkUrl}/api/v1/safes/${multisigAddress}/multisig-transactions/`;

    const response = await axios.post(url, data);

    if (response.status !== 201) {
      throw new Error(
        "failed to propose transaction: " + JSON.stringify(response.data)
      );
    }

    return;
  }

  public getTransaction(hash: string) {
    return this.serviceClient.getTransaction(hash);
  }

  public createTransactionData(
    toAddress: string,
    abi: ethers.utils.Interface,
    functionName: string,
    params: any[],
    transfersEth = "0"
  ): SafeTransactionDataPartial {
    const fn = abi.getFunction(functionName);

    if (!fn) {
      throw new Error("function name not found in abi");
    }

    const functionCall = encodeFunctionSignature(
      JSON.parse(fn.format("json")),
      params
    );

    return {
      to: toAddress,
      value: transfersEth,
      data: functionCall,
    };
  }

  public async sendMultisigTx(
    multisigAddress: string,
    signerAddress: string,
    txData: SafeTransactionDataPartial
  ): Promise<string> {
    this.ensureInit();
    const safe = await this.getSafeByAddress(multisigAddress);
    const nextNonce = await this.serviceClient.getNextNonce(multisigAddress);

    const tx = await safe.createTransaction({
      safeTransactionData: {
        ...txData,
        operation: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: EMPTY_ADDRESS,
        refundReceiver: EMPTY_ADDRESS,
        safeTxGas: 0,
        nonce: nextNonce,
      },
    });

    const signedTx = await safe.signTransaction(tx);

    const signatures = signedTx.signatures;

    const value = signatures.values().next();
    const signatureValue = value.value;

    const txHash = await safe.getTransactionHash(signedTx);

    await this.proposeTx(multisigAddress, {
      ...tx.data,
      sender: signerAddress,
      signature: signatureValue.data,
      contractTransactionHash: txHash,
      origin: JSON.stringify({
        url: "https://apps.gnosis-safe.io/tx-builder",
        name: "Transaction Builder",
      }),
    });

    return txHash;
  }
}
