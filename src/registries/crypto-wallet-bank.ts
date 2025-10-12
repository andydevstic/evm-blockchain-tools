import { OperationResult } from "mvc-common-toolkit";
import {
  CryptoWalletEngine,
  WALLET_TYPE,
  WalletStorage,
  CryptoWallet,
  WALLET_OWNERSHIP_TYPE,
} from "../common/interfaces";
import { EvmCryptoWalletData } from "../utils/crypto-wallet/evm-crypto-wallet";

export type GetWalletOptions = {
  userSecret: string;
  serverSecret: string;
  recoverySecret: string;
};

export type CreateWalletOptions = {};

export class CryptoWalletBank {
  constructor(
    protected storageEngine: WalletStorage,
    protected evmWalletEngine: CryptoWalletEngine
  ) {}

  public async importWallet(
    username: string,
    walletName: string,
    secret: string,
    data: any,
    type: WALLET_TYPE
  ): Promise<OperationResult<{ walletId: string }>> {
    let createdWallet: CryptoWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const walletData: EvmCryptoWalletData =
          await this.evmWalletEngine.importWallet(data, secret);

        createdWallet = await this.storageEngine.create({
          address: walletData.address,
          data: walletData,
          name: walletName,
          ownershipType: WALLET_OWNERSHIP_TYPE.MASTER,
          username,
          type,
        });
        break;
      default:
        throw new Error("wallet type not supported");
    }

    return {
      success: true,
      data: {
        walletId: createdWallet.id,
      },
    };
  }

  public async createNewWallet(
    username: string,
    walletName: string,
    secret: string,
    type: WALLET_TYPE,
    _options: CreateWalletOptions = {}
  ): Promise<OperationResult<{ walletId: string }>> {
    let createdWallet: CryptoWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const walletData: EvmCryptoWalletData =
          await this.evmWalletEngine.createWallet(secret);

        createdWallet = await this.storageEngine.create({
          address: walletData.address,
          data: walletData,
          name: walletName,
          ownershipType: WALLET_OWNERSHIP_TYPE.MASTER,
          username,
          type,
        });
        break;
      default:
        throw new Error("wallet type not supported");
    }

    return {
      success: true,
      data: {
        walletId: createdWallet.id,
      },
    };
  }

  public async getWallet(
    username: string,
    walletId: string,
    secret: string,
    options: Partial<GetWalletOptions>
  ): Promise<string> {
    const foundWallet = await this.storageEngine.getOne({
      username,
      id: walletId,
    });

    if (!foundWallet) {
      throw new Error("wallet not found");
    }

    const { type, data } = foundWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const privKey: string = await this.evmWalletEngine.recoverPrivateKey({
          nonce: data.nonce,
          userPin: secret,
          userSecret: options.userSecret,
          serverSecret: options.serverSecret,
        });

        return privKey;
      default:
        throw new Error("wallet type not supported");
    }
  }

  public async recoverWallet(
    username: string,
    walletId: string,
    secret: string,
    options: Partial<GetWalletOptions>
  ): Promise<string> {
    const foundWallet = await this.storageEngine.getOne({
      username,
      id: walletId,
    });

    if (!foundWallet) {
      throw new Error("wallet not found");
    }

    const { type, data } = foundWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const privKey: string = await this.evmWalletEngine.recoverPrivateKey({
          nonce: data.nonce,
          userPin: secret,
          serverSecret: options.serverSecret,
          recoverySecret: options.recoverySecret,
        });

        return privKey;
      default:
        throw new Error("wallet type not supported");
    }
  }
}
