import tronWeb from "tronweb";
import Web3 from "web3";

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

export function convertAddressToBytes32(address: string): string {
  const rawAddress = address.replace("0x", "");

  return `0x000000000000000000000000${rawAddress}`;
}
