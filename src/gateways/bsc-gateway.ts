import { ethers, Signer, Wallet } from "ethers";
import Web3 from "web3";
import { hashMessage } from "@ethersproject/hash";

import { BscGatewayConfig, IWeb3Gateway } from "../common/interfaces";
import { APP_NETWORK, NETWORK_IDS } from "../common/constants";
import { isValidEvmTxFormat } from "../utils";
import pino from "pino";

export class BscGateway implements IWeb3Gateway {
  protected web3: Web3;
  protected keepAliveInterval: NodeJS.Timeout;
  protected logger = pino();

  public provider: ethers.providers.JsonRpcProvider;
  public wallet: Wallet;
  public network = APP_NETWORK.BINANCE;

  constructor(protected config: BscGatewayConfig) {
    const name =
      this.config.network === APP_NETWORK.BINANCE
        ? APP_NETWORK.BINANCE
        : APP_NETWORK.BINANCE_TESTNET;
    const chainId =
      this.config.network === APP_NETWORK.BINANCE
        ? NETWORK_IDS.BINANCE
        : NETWORK_IDS.BINANCE_TESTNET;

    this.connect(name, chainId);
  }

  protected async checkConnection(): Promise<void> {
    try {
      await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error(`error checking connection: ${error.message}`);

      const name =
        this.config.network === APP_NETWORK.BINANCE
          ? APP_NETWORK.BINANCE
          : APP_NETWORK.BINANCE_TESTNET;
      const chainId =
        this.config.network === APP_NETWORK.BINANCE
          ? NETWORK_IDS.BINANCE
          : NETWORK_IDS.BINANCE_TESTNET;

      this.connect(name, chainId);
    }
  }

  protected connect(name: string, chainId: number): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    const provider = new ethers.providers.JsonRpcProvider(
      this.config.httpsUrl,
      {
        name,
        chainId,
      }
    );

    provider.on("error", (err) => {
      this.logger.error(`http connection error: ${err.message}`);

      this.connect(name, chainId);
    });

    this.provider = provider;
    this.keepAliveInterval = setInterval(
      this.checkConnection.bind(this),
      1000 * 60 * 10
    ); // polls every 10 mins
  }

  public get signer(): Promise<Signer> {
    return Promise.resolve(
      new ethers.Wallet(this.config.privateKey, this.provider)
    );
  }

  public async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();

    return gasPrice.toString();
  }

  public isValidTxFormat(txHash: string): boolean {
    return isValidEvmTxFormat(txHash);
  }

  public async getBlock(blockNumber: number): Promise<any> {
    const block = await this.provider.getBlock(blockNumber);

    return block;
  }

  public async recoverSigner(
    message: string,
    signedMessage: string
  ): Promise<string> {
    return ethers.utils.recoverAddress(hashMessage(message), signedMessage);
  }

  public getCurrentBlock(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  public async getSignerAddress(): Promise<string> {
    const signer = await this.signer;

    return signer.getAddress();
  }

  public getTransactionByID(txID: string): Promise<any> {
    return this.provider.getTransaction(txID);
  }
}
