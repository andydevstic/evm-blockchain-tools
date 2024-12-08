import pino from "pino";
import { timeoutHelper } from "mvc-common-toolkit";
import { BigNumber, Signer } from "ethers";

import {
  TransactionHistoryStorage,
  IWeb3Gateway,
  SignerPicker,
} from "../common/interfaces";
import { ContractModel } from "../models";
import { AdditionalGas, MinGas, TransactionStatus } from "../common/constants";
import { RoundRobinSignerPicker } from "../services";
import { getOptimizedGasPriceV2 } from "../utils";

export class BlockchainTransactionRegistry {
  protected _providerMap: Map<string, IWeb3Gateway>;
  private logger = pino();
  protected signerPicker: SignerPicker;

  constructor(
    protected transactionStorage: TransactionHistoryStorage,
    signerPicker: SignerPicker
  ) {
    this.signerPicker =
      signerPicker || new RoundRobinSignerPicker(transactionStorage);
  }

  /**
   * This function based on some assumptions:
   * - The user of this class already implemented concurrency control
   * - The providers are only used programmatically, with no ad-hoc transactions
   * @param contract
   * @param method
   * @param params
   * @param options
   */
  public async sendContractTransaction(
    contract: ContractModel,
    method: string,
    params: any[],
    options?: {
      signerPicker?: SignerPicker;
      timeoutInMs?: number;
      minGas?: string;
    }
  ) {
    let generatedTxHash: string;

    try {
      const signerPicker = options?.signerPicker || this.signerPicker;
      const pickedSigner = await signerPicker.pick(
        contract.address,
        contract.signerList
      );

      const signerAddress = await pickedSigner.getAddress();

      const { isOverride, nextNonce } = await this.reconcileSignerLastTx(
        pickedSigner,
        signerAddress
      );

      const gasPrice = await getOptimizedGasPriceV2(
        pickedSigner.provider,
        AdditionalGas.toString(),
        options?.minGas || MinGas.toString(),
        {
          useOverringGas: isOverride,
        }
      );

      const { signedTransaction, txHash } = await contract.generateTransaction(
        {
          data: params,
          functionName: method,
          nonce: nextNonce,
        },
        {
          signer: pickedSigner,
          gasPrice,
        }
      );

      await this.transactionStorage.create({
        nonce: nextNonce,
        txHash,
        signedTransaction,
        signerAddress,
        status: TransactionStatus.SCHEDULED,
        metadata: {
          isOverride,
        },
      });

      generatedTxHash = txHash;

      if (!contract.provider.sendTransaction) {
        throw new Error("provider has no sendTransaction method");
      }

      await timeoutHelper.runWithTimeout(async () => {
        const submittedTx = await pickedSigner.provider.sendTransaction(
          signedTransaction
        );

        await submittedTx.wait(1);

        await this.transactionStorage.updateByTxHash(txHash, {
          status: "executed",
        });
      }, options?.timeoutInMs || 30000);
    } catch (error) {
      this.logger.error(error.message, error.stack);

      if (generatedTxHash) {
        await this.transactionStorage.updateByTxHash(generatedTxHash, {
          status: TransactionStatus.FAILED,
          metadata: error,
        });
      }
    }
  }

  /**
   * Check if last tx was actually failed, if so then update its status to EXECUTED.
   * Edge case: The overriding tx failed, but the original timeout tx actually succeeded.
   * In this scenario,
   * @param signer The picked signer
   * @param signerAddress The signer address
   */
  protected async reconcileSignerLastTx(
    signer: Signer,
    signerAddress: string
  ): Promise<{ nextNonce: string; isOverride: boolean }> {
    // Notice: This function should sort transactions nonce DESC and status ASC (so EXECUTED comes before FAILED and SCHEDULED)
    const { txHash, status, nonce } =
      await this.transactionStorage.findSignerLastTransaction(signerAddress);

    if (status === TransactionStatus.SCHEDULED) {
      throw new Error(
        `txHash ${txHash} for signer ${signerAddress} is still pending`
      );
    }

    if (status === TransactionStatus.FAILED) {
      const foundTx = await signer.provider.getTransaction(txHash);
      /**
       * Last tx was not found, meaning it hasn't been accepted. This doesn't mean the transaction
       * will not be picked, but we can TRY to override it.
       */
      if (!foundTx) {
        return {
          nextNonce: nonce,
          isOverride: true,
        };
      }
    }

    const nextNonce = BigNumber.from(nonce).add(1).toString();

    return {
      nextNonce,
      isOverride: false,
    };
  }
}
