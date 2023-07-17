import { Signer } from "ethers";

import erc20Abi from "../common/abis/erc20.json";
import { ERC20Service } from "../services";
import { ERC20ContractModel } from "../models";
import { IERC20Service, IERC20ServiceFactory } from "../common/interfaces";

export class ERC20ServiceFactory implements IERC20ServiceFactory {
  public createERC20Service(
    address: string,
    signer: Signer,
    abi = erc20Abi
  ): IERC20Service {
    const model = new ERC20ContractModel(address, abi, signer);

    return new ERC20Service(model);
  }

  public createTRC20Service(
    address: string,
    signer: Signer,
    abi = erc20Abi
  ): IERC20Service {
    const model = new ERC20ContractModel(address, abi, signer);

    return new ERC20Service(model);
  }
}

export class MockERC20ServiceFactory implements IERC20ServiceFactory {
  public createERC20Service(
    address: string,
    signer: Signer,
    abi = erc20Abi
  ): IERC20Service {
    const mockService: any = {};

    return mockService;
  }

  public createTRC20Service(
    address: string,
    signer: Signer,
    abi = erc20Abi
  ): IERC20Service {
    const mockService: any = {};

    return mockService;
  }
}
