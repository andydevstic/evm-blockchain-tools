import { ethers } from "ethers";
import { hashMessage } from "@ethersproject/hash";

import * as tronUtils from "../utils/tron-utils";

import { IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";

export class BlockchainService {
  constructor(
    protected network: APP_NETWORK,
    protected provider: IWeb3Gateway
  ) {}

  public getTransactionByID(
    txID: string
  ): Promise<ethers.providers.TransactionResponse> {
    return this.provider.getTransactionByID(txID);
  }

  public getBlock(blockNum: number) {
    return this.provider.getBlock(blockNum);
  }

  public recoverMessageSigner(message: string, signature: string): string {
    const hashedMessage = hashMessage(message);

    const signerAddress = ethers.utils.recoverAddress(hashedMessage, signature);

    return signerAddress;
  }

  public async getTransactionBydId(txID: string) {
    const txData = await this.provider.getTransactionByID(txID);

    if (this.network === APP_NETWORK.TRON) {
      return tronUtils.parseTronTxResult(txID);
    }

    return txData;
  }
}
