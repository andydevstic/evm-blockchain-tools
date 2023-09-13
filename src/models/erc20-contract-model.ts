import { Signer } from "ethers";

import { ContractModel } from "./contract-model";
import { ContractTxOption, Waitable } from "../common/interfaces";

export interface IERC20Model extends ContractModel {
  balanceOf(address: string): Promise<string>;
  mint(
    address: string,
    amount: string,
    options?: ContractTxOption
  ): Promise<Waitable>;
  burn(amount: string, options?: ContractTxOption): Promise<Waitable>;
  burnFrom(
    address: string,
    amount: string,
    options?: ContractTxOption
  ): Promise<Waitable>;
}

export class ERC20ContractModel extends ContractModel implements IERC20Model {
  constructor(address: string, abi: any, signer: Signer) {
    super(address, abi, signer);
  }

  public async transfer(
    address: string,
    amount: string,
    options?: ContractTxOption
  ): Promise<Waitable> {
    return this.contract.transfer(address, amount, options);
  }

  public async balanceOf(address: string): Promise<string> {
    const bn = await this.contract.balanceOf(address);

    return bn.toString();
  }

  public mint(
    address: string,
    amount: string,
    options?: ContractTxOption
  ): Promise<Waitable> {
    return this.contract.mint(address, amount, options);
  }

  public burn(amount: string, options?: ContractTxOption): Promise<Waitable> {
    return this.contract.burn(amount, options);
  }

  public burnFrom(
    address: string,
    amount: string,
    options?: ContractTxOption
  ): Promise<Waitable> {
    return this.contract.burnFrom(address, amount, options);
  }
}
