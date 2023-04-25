import Web3 from 'web3';

const web3 = new Web3();

export function encodeFunctionSignature(fnCall: any, params: string[]): string {
  return web3.eth.abi.encodeFunctionCall(fnCall, params);
}
