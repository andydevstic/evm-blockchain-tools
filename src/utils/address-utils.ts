import tronWeb from "tronweb";

import { APP_NETWORK } from "../common/constants";

export function parseAddressByNetwork(
  address: string,
  network: APP_NETWORK
): string {
  if (network === APP_NETWORK.TRON) {
    return tronWeb.address.fromHex(address);
  }

  return address;
}

export function areAddressesSame(address1: string, address2: string): boolean {
  if (!address1?.length) {
    throw new Error("address1 must not be empty");
  }

  if (!address2?.length) {
    throw new Error("address2 must not be empty");
  }

  return address1.toLowerCase() === address2.toLowerCase();
}

export function convertAddressToBytes32(address: string): string {
  const rawAddress = address.replace("0x", "");

  return `0x000000000000000000000000${rawAddress}`;
}

export function isValidEvmTxFormat(txId: string): boolean {
  const regex = /^0x[a-zA-z0-9]{64}$/;

  return regex.test(txId);
}

export function isValidTronTxFormat(txId: string): boolean {
  const regex = /^[a-zA-z0-9]{64}$/;

  return regex.test(txId);
}
