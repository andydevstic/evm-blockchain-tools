import { Signer } from "ethers";

import { ContractModel } from "./contract-model";
import { Waitable } from "../common/interfaces";

export interface IERC20Model extends ContractModel {
  balanceOf(address: string): Promise<string>;
  mint(address: string, amount: string): Promise<Waitable>;
  burn(amount: string): Promise<Waitable>;
  burnFrom(address: string, amount: string): Promise<Waitable>;
}

export abstract class ERC20ContractModel
  extends ContractModel
  implements IERC20Model
{
  constructor(address: string, abi: any, signer: Signer) {
    super(address, abi, signer);
  }

  public async balanceOf(address: string): Promise<string> {
    const bn = await this.contract.balanceOf(address);

    return bn.toString();
  }

  public mint(address: string, amount: string): Promise<Waitable> {
    return this.contract.mint(address, amount);
  }

  public burn(amount: string): Promise<Waitable> {
    return this.contract.burn(amount);
  }

  public burnFrom(address: string, amount: string): Promise<Waitable> {
    return this.contract.burnFrom(address, amount);
  }
}
