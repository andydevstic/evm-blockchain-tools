import { OperationResult } from "mvc-common-toolkit";
import {
  CryptoWalletEngine,
  WALLET_TYPE,
  WalletStorage,
  CryptoWallet,
  WALLET_OWNERSHIP_TYPE,
} from "../common/interfaces";
import { EvmCryptoWalletData } from "../utils/crypto-wallet/evm-crypto-wallet";

export interface HasWalletId {
  walletId: string;
}

export type GetWalletOptions = {
  userSecret: string;
  serverSecret: string;
  recoverySecret: string;
};

export type CreateWalletOptions = {
  userKeepsOwnPrivate: boolean;
};

export class CryptoWalletBank {
  constructor(
    protected storageEngine: Pick<WalletStorage, "create" | "getOne">,
    protected evmWalletEngine: CryptoWalletEngine
  ) {}

  public async importWallet<T extends HasWalletId>(
    username: string,
    walletName: string,
    secret: string,
    data: any,
    type: WALLET_TYPE,
    options: CreateWalletOptions = {
      userKeepsOwnPrivate: true,
    }
  ): Promise<OperationResult<T>> {
    let createdWallet: CryptoWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const walletData: EvmCryptoWalletData =
          await this.evmWalletEngine.importWallet(data, secret);

        if (options?.userKeepsOwnPrivate) {
          delete walletData.userSecretPart;
        }

        createdWallet = await this.storageEngine.create({
          address: walletData.address,
          data: walletData,
          name: walletName,
          ownershipType: WALLET_OWNERSHIP_TYPE.MASTER,
          username,
          type,
          metadata: options,
        });

        return {
          success: true,
          data: {
            walletId: createdWallet.id,
            userPrivate: options?.userKeepsOwnPrivate
              ? walletData.userSecretPart
              : null,
          } as unknown as T,
        };
      default:
        throw new Error("wallet type not supported");
    }
  }

  public async createNewWallet<T extends HasWalletId>(
    username: string,
    walletName: string,
    secret: string,
    type: WALLET_TYPE,
    options: CreateWalletOptions = {
      userKeepsOwnPrivate: true,
    }
  ): Promise<OperationResult<T>> {
    let createdWallet: CryptoWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const walletData: EvmCryptoWalletData =
          await this.evmWalletEngine.createWallet(secret);

        if (options?.userKeepsOwnPrivate) {
          delete walletData.userSecretPart;
        }

        createdWallet = await this.storageEngine.create({
          address: walletData.address,
          data: walletData,
          name: walletName,
          ownershipType: WALLET_OWNERSHIP_TYPE.MASTER,
          username,
          type,
          metadata: options,
        });

        return {
          success: true,
          data: {
            walletId: createdWallet.id,
            userPrivate: options?.userKeepsOwnPrivate
              ? walletData.userSecretPart
              : null,
          } as unknown as T,
        };
      default:
        throw new Error("wallet type not supported");
    }
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
