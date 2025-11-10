import { OperationResult } from "mvc-common-toolkit";
import {
  CryptoWalletEngine,
  WALLET_TYPE,
  WalletStorage,
  CryptoWallet,
  WALLET_OWNERSHIP_TYPE,
} from "../common/interfaces";
import { EvmCryptoWalletData } from "../utils/crypto-wallet/evm-crypto-wallet";
import { ERR_CODE } from "../common/constants";

export interface CreatedWalletResponse {
  walletId: string;
  address: string;
  userPrivate?: string;
}

export type GetWalletOptions = {
  userSecret: string;
  serverSecret: string;
  recoverySecret: string;
};

export type CreateWalletOptions = {
  userKeepsOwnPrivate: boolean;
  recoverable: boolean;
};

export class CryptoWalletBank {
  constructor(
    protected storageEngine: Pick<
      WalletStorage,
      "create" | "getOne" | "deleteById"
    >,
    protected evmWalletEngine: CryptoWalletEngine
  ) {}

  public async importWallet(
    username: string,
    walletName: string,
    secret: string,
    data: any,
    type: WALLET_TYPE,
    options: CreateWalletOptions = {
      userKeepsOwnPrivate: false,
      recoverable: true,
    }
  ): Promise<OperationResult<CreatedWalletResponse>> {
    let createdWallet: CryptoWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const walletData: EvmCryptoWalletData =
          await this.evmWalletEngine.importWallet(data, secret);

        if (options?.userKeepsOwnPrivate) {
          delete walletData.userSecretPart;
        }

        if (!options?.recoverable) {
          delete walletData.serverSecretPart;
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
            address: createdWallet.address,
            userPrivate: options?.userKeepsOwnPrivate
              ? walletData.userSecretPart
              : null,
          },
        };
      default:
        throw new Error("wallet type not supported");
    }
  }

  public async createNewWallet(
    username: string,
    walletName: string,
    secret: string,
    type: WALLET_TYPE,
    options: CreateWalletOptions = {
      userKeepsOwnPrivate: false,
      recoverable: true,
    }
  ): Promise<OperationResult<CreatedWalletResponse>> {
    let createdWallet: CryptoWallet;

    switch (type) {
      case WALLET_TYPE.EVM:
        const walletData: EvmCryptoWalletData =
          await this.evmWalletEngine.createWallet(secret);

        if (options?.userKeepsOwnPrivate) {
          delete walletData.userSecretPart;
        }

        if (!options?.recoverable) {
          delete walletData.serverSecretPart;
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
            address: createdWallet.address,
            userPrivate: options?.userKeepsOwnPrivate
              ? walletData.userSecretPart
              : null,
          },
        };
      default:
        throw new Error("wallet type not supported");
    }
  }

  public async deleteWallet(
    username: string,
    walletName: string
  ): Promise<OperationResult<void>> {
    const foundWallet = await this.storageEngine.getOne({
      username,
      name: walletName,
    });

    if (!foundWallet) {
      return {
        success: false,
        message: "wallet not found",
        code: ERR_CODE.WALLET_NOT_FOUND,
      };
    }

    await this.storageEngine.deleteById(foundWallet.id);

    return {
      success: true,
    };
  }

  public async getWalletInfo(
    username: string,
    walletName: string
  ): Promise<OperationResult<CreatedWalletResponse>> {
    const foundWallet = await this.storageEngine.getOne({
      username,
      name: walletName,
    });

    if (!foundWallet) {
      return {
        success: false,
        message: "wallet not found",
        code: ERR_CODE.WALLET_NOT_FOUND,
      };
    }

    return {
      success: true,
      data: {
        address: foundWallet.address,
        walletId: foundWallet.id,
      },
    };
  }

  public async recoverWallet(
    username: string,
    walletName: string,
    secret: string,
    options: Partial<GetWalletOptions>
  ): Promise<OperationResult<string>> {
    const foundWallet = await this.storageEngine.getOne({
      username,
      name: walletName,
    });

    if (!foundWallet) {
      return {
        success: false,
        message: "wallet not found",
        code: ERR_CODE.WALLET_NOT_FOUND,
      };
    }

    const { type, data } = foundWallet;

    const userSecret = options.userSecret || data.userSecretPart;

    if (!userSecret && !data.recoverySecretPart) {
      return {
        success: false,
        message: "missing recovery secret and user secret for recover flow",
        code: ERR_CODE.RECOVERY_SECRET_NOT_STORED,
      };
    }

    switch (type) {
      case WALLET_TYPE.EVM:
        const privKey: string = await this.evmWalletEngine.recoverPrivateKey({
          nonce: data.nonce,
          userPin: secret,
          userSecret,
          serverSecret: data.serverSecretPart,
          recoverySecret: data.recoverySecretPart,
        });

        return {
          success: true,
          data: privKey,
        };
      default:
        throw new Error("wallet type not supported");
    }
  }
}
