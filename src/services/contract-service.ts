import { Interface } from "ethers/lib/utils";
import { ContractModel } from "../models/contract-model";

export abstract class ContractService<T extends ContractModel> {
  constructor(protected contract: T) {}

  public get abiInterface(): Interface {
    return this.contract.abi;
  }
}
