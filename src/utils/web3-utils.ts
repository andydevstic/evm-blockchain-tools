import Web3 from "web3";

import { BigNumber } from "ethers";

import { IWeb3Gateway } from "../common/interfaces";

const web3 = new Web3();

export function encodeFunctionSignature(fnCall: any, params: string[]): string {
  return web3.eth.abi.encodeFunctionCall(fnCall, params);
}

/**
 * Always add up 0.5 GWei to current gas to prevent transaction underpriced
 * @param gateway Web3 gateway
 * @param addupGas the amount to addup, default 7 Gwei
 * @returns
 */
export async function getOptimizedGasPrice(
  gateway: IWeb3Gateway,
  addupGas = BigNumber.from("1000000000"), // 1 GWei
  minGas = BigNumber.from("5000000000") // 5 GWei
): Promise<BigNumber> {
  const gasPrice: BigNumber = await gateway.provider.getGasPrice();

  const newGas = gasPrice.add(addupGas);

  return newGas.gte(minGas) ? newGas : minGas;
}
