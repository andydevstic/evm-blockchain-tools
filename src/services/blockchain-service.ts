import { ethers } from "ethers";
import { hashMessage } from "@ethersproject/hash";
import TronDecoder from "tron-tx-decoder";
import tronWeb from "tronweb";

import * as tronUtils from "../utils/tron-utils";

import { abis } from "../common/abis";
import { IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";

export class BlockchainService {
  constructor(protected provider: IWeb3Gateway) {}

  public getTransactionByID(
    txID: string
  ): Promise<ethers.providers.TransactionResponse> {
    return this.provider.getTransactionByID(txID);
  }

  public getBlock(blockNum: number) {
    return this.provider.getBlock(blockNum);
  }

  public async parseERC20TxByNetwork(
    data: string,
    value: any,
    txId?: string
  ): Promise<any> {
    const erc20Abi = new ethers.utils.Interface(abis.erc20);
    if (this.provider.network !== APP_NETWORK.TRON) {
      return erc20Abi.parseTransaction({
        data,
        value,
      });
    }

    const tronDecoder = new TronDecoder({ mainnet: true });
    const { methodName, inputTypes, decodedInput } =
      await tronDecoder.decodeInputById(txId);

    const to = decodedInput[0];
    const amount = decodedInput[1];

    return {
      args: [tronWeb.address.fromHex(to), amount.toString()],
      signature: `${methodName}(${inputTypes.join(",")})`,
    };
  }

  public recoverMessageSigner(message: string, signature: string): string {
    const hashedMessage = hashMessage(message);

    const signerAddress = ethers.utils.recoverAddress(hashedMessage, signature);

    return signerAddress;
  }

  public async getTransactionBydId(txID: string) {
    const txData = await this.provider.getTransactionByID(txID);

    if (this.provider.network === APP_NETWORK.TRON) {
      return tronUtils.parseTronTxResult(txID);
    }

    return txData;
  }
}
