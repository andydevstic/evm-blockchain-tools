import { ContractService } from "./contract-service";
import { ERC20ContractModel } from "../models/erc20-contract-model";
import { APP_NETWORK } from "../common/constants";

export class ERC20Service extends ContractService<ERC20ContractModel> {
  public static TRANSFER_FN_SIG = "transfer()";

  constructor(
    protected network: APP_NETWORK,
    protected contract: ERC20ContractModel
  ) {
    super(contract);
  }

  public async balanceOf(address: string): Promise<string> {
    const bn = await this.contract.balanceOf(address);

    return bn.toString();
  }

  public async mint(address: string, amount: string): Promise<void> {
    const tx = await this.contract.mint(address, amount);

    await tx.wait();
  }

  public async burn(amount: string): Promise<void> {
    const tx = await this.contract.burn(amount);

    await tx.wait();
  }

  public async burnFrom(address: string, amount: string): Promise<void> {
    const tx = await this.contract.burnFrom(address, amount);

    await tx.wait();
  }
}
