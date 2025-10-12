import { ethers } from "ethers";
import * as crypto from "crypto";
import sodium from "libsodium-wrappers";

import {
  CryptoWalletConfig,
  CryptoWalletEngine,
  GenerateKeyPairResponse,
  RecoverPrivateKeyData,
} from "../../common/interfaces";
import { decrypt, encrypt } from "../aes-encryption";
import { norm32KeyHex } from "../web3-utils";

const SEP = "\x00"; // unambiguous field separator
const VERSION = "v1"; // format version
const SHARD_LENGTH = 16;

export type EvmCryptoWalletData = {
  address: string;
  nonce: string;
  serverSecretPart: string;
  userSecretPart: string;
  recoverySecretPart: string;
};

export class EvmCryptoWallet implements CryptoWalletEngine {
  private isInitialized = false;
  private serverPrivateKey: Uint8Array;

  constructor(protected config: CryptoWalletConfig) {}

  protected async validateServerKey(serverKeyHex: string) {
    const key = norm32KeyHex(serverKeyHex);

    const n = sodium.randombytes_buf(24);
    const m = sodium.randombytes_buf(16);
    const ct = sodium.crypto_secretbox_easy(m, n, key);
    const pt = sodium.crypto_secretbox_open_easy(ct, n, key);

    if (!sodium.memcmp(pt, m)) throw new Error("server key self-test failed");

    this.serverPrivateKey = key;
  }

  private async init() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    await sodium.ready;

    await this.validateServerKey(this.config.privateKey);
  }

  private tryDec = (hex?: string, key?: string) => {
    if (!hex || !key) return undefined;
    try {
      return decrypt(hex, key);
    } catch {
      return undefined;
    }
  };

  protected buildUserPrivate(userPin?: string): string {
    const { privateKey: secret, defaultUserPin } = this.config;
    return [VERSION, "user", secret, userPin ?? defaultUserPin].join(SEP);
  }
  protected buildServerPrivate(): string {
    const { privateKey: secret, adminPin } = this.config;
    return [VERSION, "server", secret, adminPin].join(SEP);
  }
  protected buildRecoveryPrivate(userPin?: string): string {
    const { privateKey: secret, adminPin, defaultUserPin } = this.config;
    return [
      VERSION,
      "recovery",
      secret,
      userPin ?? defaultUserPin,
      adminPin,
    ].join(SEP);
  }

  public async importWallet(
    privateKey: any,
    userPin?: string
  ): Promise<EvmCryptoWalletData> {
    await this.init();
    const wallet = new ethers.Wallet(privateKey);

    const publicKey = await wallet.getAddress();

    return this.processGeneratedKey(userPin, privateKey, publicKey);
  }

  public async createWallet(userPin?: string): Promise<EvmCryptoWalletData> {
    await this.init();
    const { privateKey, publicKey } = await this.generateKeyPair();

    return this.processGeneratedKey(userPin, privateKey, publicKey);
  }

  protected processGeneratedKey(
    userPin: string,
    privateKey: string,
    publicKey: string
  ): EvmCryptoWalletData {
    const evmHex = privateKey.replace(/^0x/, "").padStart(64, "0");
    const pkBytes = sodium.from_hex(evmHex);

    const nonce = crypto.randomBytes(24);
    const [userSecret, serverSecret, recoverySecret] =
      this.splitPrivateKeyToParts(pkBytes, nonce);

    const signedUserSecret = encrypt(
      userSecret,
      this.buildUserPrivate(userPin)
    );
    const signedServerSecret = encrypt(serverSecret, this.buildServerPrivate());
    const signedRecoverySecret = encrypt(
      recoverySecret,
      this.buildRecoveryPrivate(userPin)
    );

    return {
      address: publicKey,
      nonce: nonce.toString("hex"),
      serverSecretPart: signedServerSecret,
      userSecretPart: signedUserSecret,
      recoverySecretPart: signedRecoverySecret,
    };
  }

  protected async generateKeyPair(): Promise<GenerateKeyPairResponse> {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey.toString();

    const publicKey = await wallet.getAddress();

    return {
      privateKey,
      publicKey,
    };
  }

  protected splitPrivateKeyToParts(
    pkBytes: Uint8Array, // 32 bytes
    nonce: Uint8Array // 24 bytes
  ): [string, string, string] {
    const ct = sodium.crypto_secretbox_easy(
      pkBytes,
      nonce,
      this.serverPrivateKey
    ); // 48 bytes
    const buf = Buffer.from(ct);
    // fixed shards because 48/3 = 16
    const A = buf.subarray(0, SHARD_LENGTH);
    const B = buf.subarray(SHARD_LENGTH, 2 * SHARD_LENGTH);
    const C = buf.subarray(2 * SHARD_LENGTH);
    const user = Buffer.concat([A, B]);
    const server = Buffer.concat([B, C]);
    const recovery = Buffer.concat([A, C]);
    return [
      user.toString("hex"),
      server.toString("hex"),
      recovery.toString("hex"),
    ];
  }

  public async recoverPrivateKey(data: RecoverPrivateKeyData): Promise<string> {
    await this.init();

    // Guard each unwrap so “any 2 of 3” works (bad share ≠ hard fail)

    const userKeyStr = this.buildUserPrivate(data.userPin);
    const serverKeyStr = this.buildServerPrivate();
    const recovKeyStr = this.buildRecoveryPrivate(data.userPin);

    const decUser = this.tryDec(data.userSecret, userKeyStr);
    const decServer = this.tryDec(data.serverSecret, serverKeyStr);
    const decRecovery = this.tryDec(data.recoverySecret, recovKeyStr);

    const okUS = !!(decUser && decServer);
    const okUR = !!(decUser && decRecovery);
    const okSR = !!(decServer && decRecovery);
    if (!okUS && !okUR && !okSR) {
      throw new Error("must provide 2 out of 3 keys (share unwrap failed)");
    }

    // Reassemble ciphertext (fixed shard math with SHARD = 16)
    const first = Buffer.from((decUser ?? decRecovery)!, "hex").subarray(
      0,
      SHARD_LENGTH
    );
    const second = decUser
      ? Buffer.from(decUser, "hex").subarray(SHARD_LENGTH)
      : Buffer.from(decServer!, "hex").subarray(0, SHARD_LENGTH);
    const third = Buffer.from((decServer ?? decRecovery)!, "hex").subarray(
      SHARD_LENGTH
    );

    const reunited = Buffer.concat([first, second, third]);

    // Open the main secretbox with server key + nonce
    const pt = sodium.crypto_secretbox_open_easy(
      new Uint8Array(reunited),
      Buffer.from(data.nonce, "hex"),
      this.serverPrivateKey
    ); // Uint8Array(32)

    const evmPrivHex = sodium.to_hex(pt); // 64 hex chars
    return "0x" + evmPrivHex;
  }
}
