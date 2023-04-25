import { Contract, ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Subscription } from "src/common/interfaces";

export abstract class ContractModel {
  protected contract: Contract;

  public abi: Interface;

  constructor(public address: string, abi: any, signer: any) {
    this.abi = new ethers.utils.Interface(abi);

    this.contract = new Contract(address, abi, signer);
  }

  public async queryForEvents(
    eventFilter: string | ethers.EventFilter,
    startingBlock: number | string,
    endingBlock?: number | string
  ) {
    const events = await this.contract.queryFilter(
      eventFilter,
      startingBlock,
      endingBlock
    );

    return events;
  }

  public subscribeForEvent(
    eventFilter: string | ethers.EventFilter,
    callback: ethers.providers.Listener
  ): Subscription {
    this.contract.on(eventFilter, callback);

    return {
      unsubscribe: () => {
        this.contract.removeListener(eventFilter, callback);
      },
    };
  }
}
