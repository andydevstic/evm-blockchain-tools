import { ALCHEMY_NETWORK } from "../common/constants";
import { IWeb3Gateway, IWeb3GatewayFactory } from "../common/interfaces";

export class Web3GatewayRegistry {
  protected registry = new Map<string, IWeb3Gateway>();

  constructor(protected web3GatewayFactory: IWeb3GatewayFactory) {}

  public getAlchemyProvider(
    apiKey: string,
    privateKey: string,
    network: ALCHEMY_NETWORK
  ): IWeb3Gateway {
    const hashKey = `${apiKey}_${privateKey}_${network}`;

    if (this.registry.has(hashKey)) {
      return this.registry.get(hashKey);
    }

    const provider = this.web3GatewayFactory.createAlchemyProvider(
      apiKey,
      privateKey,
      network
    );

    this.registry.set(hashKey, provider);

    return provider;
  }

  public getQuicknodeProvider(
    quickNodeHttpsURL: string,
    privateKey: string
  ): IWeb3Gateway {
    const hashKey = `${quickNodeHttpsURL}_${privateKey}`;

    if (this.registry.has(hashKey)) {
      return this.registry.get(hashKey);
    }

    const provider = this.web3GatewayFactory.createQuicknodeProvider(
      quickNodeHttpsURL,
      privateKey
    );

    this.registry.set(hashKey, provider);

    return provider;
  }

  public getTronProvider(
    fullHostURL: string,
    apiKey: string,
    privateKey: string
  ): IWeb3Gateway {
    const hashKey = `${fullHostURL}_${apiKey}_${privateKey}`;

    if (this.registry.has(hashKey)) {
      return this.registry.get(hashKey);
    }

    const provider = this.web3GatewayFactory.createTronProvider(
      fullHostURL,
      apiKey,
      privateKey
    );

    this.registry.set(hashKey, provider);

    return provider;
  }
}
