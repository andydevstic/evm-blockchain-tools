import TronWeb from "tronweb";
import { Signer, Wallet } from "ethers";

import { IWeb3Gateway, TronGatewayConfig } from "../common/interfaces";

export class TronGateway implements IWeb3Gateway {
  protected _tron: any;
  protected signerAddress: string;
  public wallet: Wallet;

  constructor(protected configService: TronGatewayConfig) {
    this._tron = new TronWeb({
      fullHost: configService.fullHostUrl,
      headers: {
        "TRON-PRO-API-KEY": configService.apiKey,
      },
      privateKey: configService.privateKey,
    });

    this.signerAddress = this._tron.address.fromPrivateKey(
      this.configService.privateKey
    );
  }

  public get signer(): Promise<Signer> {
    return this._tron.trx.getAccount(this.signerAddress);
  }

  public async getCurrentBlock(): Promise<number> {
    const blockData = await this._tron.trx.getCurrentBlock();

    return blockData?.block_header?.raw_data?.number;
  }

  public getBlock(blockNumber: number) {
    return this._tron.trx.getBlockByNumber(blockNumber);
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
