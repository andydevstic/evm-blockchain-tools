import TronWeb from "tronweb";
import { Signer, Wallet } from "ethers";

import { IWeb3Gateway, TronGatewayConfig } from "../common/interfaces";
import { APP_NETWORK } from "../common/constants";
import { isValidTronTxFormat } from "../utils";

export class TronGateway implements IWeb3Gateway {
  protected _tron: any;
  protected signerAddress: string;
  public wallet: Wallet;

  public network = APP_NETWORK.TRON;

  constructor(protected config: TronGatewayConfig) {
    this.signerAddress = this._tron.address.fromPrivateKey(config.privateKey);

    this.connect();
  }

  public connect(): void {
    this._tron = new TronWeb({
      fullHost: this.config.fullHostUrl,
      headers: {
        "TRON-PRO-API-KEY": this.config.apiKey,
      },
      privateKey: this.config.privateKey,
    });
  }

  public get signer(): Promise<Signer> {
    return this._tron.trx.getAccount(this.signerAddress);
  }

  public async getCurrentBlock(): Promise<number> {
    const blockData = await this._tron.trx.getCurrentBlock();

    return blockData?.block_header?.raw_data?.number;
  }

  public isValidTxFormat(txHash: string): boolean {
    return isValidTronTxFormat(txHash);
  }

  public getBlock(blockNumber: number) {
    return this._tron.trx.getBlockByNumber(blockNumber);
  }

  public async getGasPrice(): Promise<string> {
    throw new Error("get gas price not supported for Tron");
  }

  public recoverSigner(
    message: string,
    signedMessage: string
  ): Promise<string> {
    return this._tron.trx.verifyMessageV2(message, signedMessage);
  }

  public async getSignerAddress(): Promise<string> {
    return this.signerAddress;
  }

  public async getTransactionByID(txID: string): Promise<any> {
    const txInfo = await this._tron.trx.getTransactionInfo(txID);

    const txData = await this._tron.trx.getTransaction(txID);

    return {
      txInfo,
      txData,
    };
  }
}
