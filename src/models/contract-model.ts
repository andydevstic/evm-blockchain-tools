import { Contract, ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Subscription } from "src/common/interfaces";

export abstract class ContractModel {
  protected contract: Contract;

  public abi: Interface;

  constructor(address: string, abi: any, signer: any) {
    this.abi = new ethers.utils.Interface(abi);

    this.contract = new Contract(address, abi, signer);
  }

  public subscribeForEvent(
    eventName: string,
    callback: ethers.providers.Listener
  ): Subscription {
    this.contract.on(eventName, callback);

    return {
      unsubscribe: () => {
        this.contract.removeListener(eventName, callback);
      },
    };
  }
}
