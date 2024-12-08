import { Signer } from "ethers";
import { OperationResult, workflows } from "mvc-common-toolkit";

import { TransactionHistoryStorage, SignerPicker } from "../common/interfaces";
import { TransactionStatus } from "../common/constants";

export class RoundRobinSignerPicker implements SignerPicker {
  protected _signerMap: Map<string, Signer[]> = new Map();
  protected _signerCallingMap: Map<string, number> = new Map();

  constructor(protected transactionStorage: TransactionHistoryStorage) {}

  protected resetSignerData(address: string, signerList: Signer[]) {
    this._signerMap.set(address, signerList);
    this._signerCallingMap.set(address, 0);
  }

  protected advanceNextIndex(address: string): number {
    const signers = this._signerMap.get(address);
    if (!signers || signers.length === 0) {
      throw new Error(`Signer list for address ${address} is empty.`);
    }

    const currentCallingIndex = this._signerCallingMap.get(address);
    const maxIndex = this._signerMap.get(address).length - 1;

    const nextIndex =
      currentCallingIndex + 1 > maxIndex ? 0 : currentCallingIndex + 1;

    this._signerCallingMap.set(address, nextIndex);

    return nextIndex;
  }

  public async pick(address: string, signerList: Signer[]): Promise<Signer> {
    if (!signerList.length) {
      throw new Error("signer list cannot be empty");
    }

    if (!address) {
      throw new Error("address cannot be empty");
    }

    if (this._signerMap.has(address)) {
      const existingSigners = this._signerMap.get(address);

      // Signer list has changed
      if (existingSigners !== signerList) {
        this.resetSignerData(address, signerList);
      }
    } else {
      this.resetSignerData(address, signerList);
    }

    const allSignersCount = this._signerMap.get(address).length;
    const retryTask = new workflows.RetryTask(
      async () => {
        const nextIndex = this.advanceNextIndex(address);

        const nextSigner = this._signerMap.get(address)[nextIndex];
        const signerAddress = await nextSigner.getAddress();

        // Check if signer is still alive
        await nextSigner.getChainId();

        const signerLastTx =
          await this.transactionStorage.findSignerLastTransaction(
            signerAddress
          );

        if (!signerLastTx) {
          return nextSigner;
        }

        if (signerLastTx.status === TransactionStatus.SCHEDULED) {
          throw new Error(`signer ${signerAddress} is still busy`);
        }

        return nextSigner;
      },
      {
        retryCount: allSignersCount * 3,
        taskName: `pick_signer_for_contract_${address}`,
        retryIntervalInMs: 2000,
        returnOperationResult: true,
      }
    );

    const result = await retryTask.run<OperationResult<Signer>>();

    if (!result.success) {
      throw new Error("all signers are busy or unavailable");
    }

    return result.data;
  }
}
