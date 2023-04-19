import { Contract, ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

export abstract class ContractModel {
  protected contract: Contract;

  public abi: Interface;

  constructor(address: string, abi: any, signer: any) {
    this.abi = new ethers.utils.Interface(abi);

    this.contract = new Contract(address, abi, signer);
  }
}
