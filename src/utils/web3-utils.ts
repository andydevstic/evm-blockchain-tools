import Web3 from "web3";
import sodium from "libsodium-wrappers";

import { BigNumber, ethers } from "ethers";

import {
  GenerateKeyPairResponse,
  IWeb3Gateway,
  RecoverPrivateKeyData,
} from "../common/interfaces";
import { PRIVATE_KEY_SHARD_SIZE } from "../common/constants";

const web3 = new Web3();

export function encodeFunctionSignature(fnCall: any, params: string[]): string {
  return web3.eth.abi.encodeFunctionCall(fnCall, params);
}

/**
 * Always add up 0.5 GWei to current gas to prevent transaction underpriced
 * @param gateway Web3 gateway
 * @param addupGas the amount to addup, default 1 Gwei
 * @returns
 */
export async function getOptimizedGasPrice(
  gateway: IWeb3Gateway,
  addupGas = "1000000000", // 1 GWei
  minGas = "5000000000" // 5 GWei,
): Promise<string> {
  const gasPrice: BigNumber = await gateway.provider.getGasPrice();

  let newGas = gasPrice.add(addupGas);

  return newGas.gte(minGas) ? newGas.toString() : minGas;
}

/**
 * Always add up 0.5 GWei to current gas to prevent transaction underpriced
 * @param gateway Web3 gateway
 * @param addupGas the amount to addup, default 1 Gwei
 * @returns
 */
export async function getOptimizedGasPriceV2(
  provider: ethers.providers.Provider,
  addupGas = "1000000000", // 1 GWei
  minGas = "5000000000", // 5 GWei,
  option?: {
    useOverridingGas: boolean;
  }
): Promise<string> {
  const gasPrice: BigNumber = await provider.getGasPrice();

  let newGas = gasPrice.add(addupGas);

  if (option?.useOverridingGas) {
    newGas = newGas.add(addupGas);
  }

  return newGas.gte(minGas) ? newGas.toString() : minGas;
}

export async function generateKeyPair(): Promise<GenerateKeyPairResponse> {
  const wallet = ethers.Wallet.createRandom();
  const privateKey = wallet.privateKey.toString();

  const publicKey = await wallet.getAddress();

  return {
    privateKey,
    publicKey,
  };
}

export function aeadEnc(
  msgUtf8: string,
  nonce24: Uint8Array,
  key32: Uint8Array
) {
  const ad = undefined; // optional associated data
  return sodium.crypto_secretbox_easy(
    sodium.from_string(msgUtf8),
    nonce24,
    key32
  );
}

export function aeadDec(
  ct: Uint8Array,
  nonce24: Uint8Array,
  key32: Uint8Array
) {
  return sodium.crypto_secretbox_open_easy(ct, nonce24, key32); // Uint8Array
}

export function norm24(n: Uint8Array | Buffer) {
  if (n.length !== sodium.crypto_secretbox_NONCEBYTES)
    throw new Error("nonce must be 24 bytes");
  return new Uint8Array(n);
}

export function argonKey(pass: string, salt16: Uint8Array): Uint8Array {
  return sodium.crypto_pwhash(
    32,
    pass,
    salt16,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
}

export function norm32KeyHex(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]{64}$/.test(clean))
    throw new Error("server key must be 32-byte hex");
  return sodium.from_hex(clean);
}

export function splitPrivateKeyToParts(
  privateKey: string,
  nonce: Buffer
): string[] {
  const cipherKey = sodium.crypto_secretbox_easy(
    privateKey,
    nonce,
    this.encryptionKey
  );

  const bufferCipherKey = Buffer.from(cipherKey);
  const shardSize = Math.floor(bufferCipherKey.length / 3);

  const firstPart = bufferCipherKey.subarray(0, shardSize);
  const secondPart = bufferCipherKey.subarray(shardSize, shardSize * 2);
  const thirdPart = bufferCipherKey.subarray(shardSize * 2);

  const userSecret = Buffer.concat([firstPart, secondPart]);
  const serverSecret = Buffer.concat([secondPart, thirdPart]);
  const recoverySecret = Buffer.concat([firstPart, thirdPart]);

  return [
    userSecret.toString("hex"),
    serverSecret.toString("hex"),
    recoverySecret.toString("hex"),
  ];
}

export async function recoverPrivateKey(
  data: RecoverPrivateKeyData
): Promise<string> {
  const isValid1 = data.recoverySecret && data.serverSecret;
  const isValid2 = data.userSecret && data.serverSecret;
  const isValid3 = data.userSecret && data.recoverySecret;

  if (!isValid1 && !isValid2 && !isValid3) {
    throw new Error("must provide 2 out of 3 keys");
  }

  const firstPart = Buffer.from(
    data.userSecret || data.recoverySecret,
    "hex"
  ).subarray(0, PRIVATE_KEY_SHARD_SIZE);

  const secondPart = data.userSecret
    ? Buffer.from(data.userSecret, "hex").subarray(PRIVATE_KEY_SHARD_SIZE)
    : Buffer.from(data.serverSecret, "hex").subarray(0, PRIVATE_KEY_SHARD_SIZE);

  const thirdPart = Buffer.from(
    data.serverSecret || data.recoverySecret,
    "hex"
  ).subarray(PRIVATE_KEY_SHARD_SIZE);

  const reunited = Buffer.concat([firstPart, secondPart, thirdPart]);

  const decrypted = sodium.crypto_secretbox_open_easy(
    reunited,
    Buffer.from(data.nonce, "hex"),
    this.encryptionKey,
    "text"
  );

  return decrypted;
}
