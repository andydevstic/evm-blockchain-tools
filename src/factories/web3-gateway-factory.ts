import { ALCHEMY_NETWORK } from "../common/constants";
import { IWeb3Gateway, IWeb3GatewayFactory } from "../common/interfaces";
import { AlchemyGateway, BscGateway, TronGateway } from "../gateways";

export class Web3GatewayFactory implements IWeb3GatewayFactory {
  public createAlchemyProvider(
    apiKey: string,
    privateKey: string,
    network: ALCHEMY_NETWORK
  ): IWeb3Gateway {
    return new AlchemyGateway({
      apiKey,
      privateKey,
      network,
    });
  }

  public createQuicknodeProvider(
    quickNodeHttpsURL: string,
    privateKey: string
  ): IWeb3Gateway {
    return new BscGateway({
      httpsUrl: quickNodeHttpsURL,
      privateKey,
    });
  }

  public createTronProvider(
    fullHostURL: string,
    apiKey: string,
    privateKey: string
  ): IWeb3Gateway {
    return new TronGateway({
      fullHostUrl: fullHostURL,
      apiKey,
      privateKey,
    });
  }
}

export class MockWeb3GatewayFactory implements IWeb3GatewayFactory {
  public createAlchemyProvider(
    apiKey: string,
    privateKey: string,
    network: ALCHEMY_NETWORK
  ): IWeb3Gateway {
    const mock: any = {};

    return mock;
  }

  public createQuicknodeProvider(
    quickNodeHttpsURL: string,
    privateKey: string
  ): IWeb3Gateway {
    const mock: any = {};

    return mock;
  }

  public createTronProvider(
    fullHostURL: string,
    apiKey: string,
    privateKey: string
  ): IWeb3Gateway {
    const mock: any = {};

    return mock;
  }
}
