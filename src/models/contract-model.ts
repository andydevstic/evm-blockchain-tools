import { Contract, ethers, Signer } from "ethers";
import { Interface } from "ethers/lib/utils";
import {
  GenerateContractTransactionData,
  Subscription,
} from "../common/interfaces";

export abstract class ContractModel {
  public contract: Contract;
  public abi: Interface;

  protected _signerList: Signer[] = [];

  constructor(public address: string, abi: any, public signer: Signer) {
    this.abi = new ethers.utils.Interface(abi);

    this.contract = new Contract(address, abi, signer);

    this._signerList.push(signer);
  }

  public setDefaultSigner(signer: Signer) {
    if (!this._signerList.includes(signer)) {
      throw new Error("signer is not in signer list");
    }

    this.signer = signer;
  }

  public registerBackupSigner(signers: Signer[]): void {
    this._signerList.push(...signers);
  }

  public get signerList(): Signer[] {
    return this._signerList;
  }

  public removeSigner(signer: Signer): void {
    this._signerList = this._signerList.filter((i) => i !== signer);
  }

  public get provider(): ethers.providers.Provider {
    return this.signer.provider;
  }

  public async generateTransaction(
    data: GenerateContractTransactionData,
    options?: {
      signer?: Signer;
      gasPrice?: string;
    }
  ): Promise<{ txHash: string; signedTransaction: string }> {
    const signer = options?.signer || this.signer;
    const params = data.data;

    const gasPrice = options?.gasPrice || (await signer.provider.getGasPrice());
    const signerAddress = await signer.getAddress();

    const unsignedPopulatedTx = await this.populateTransaction(
      data.functionName,
      params,
      {
        gasPrice: gasPrice.toString(),
        signer,
      }
    );

    const signerPopulatedTx = await signer.populateTransaction(
      unsignedPopulatedTx
    );

    const signerNextNonce = signerPopulatedTx.nonce.toString();

    if (data.nonce && data.nonce > signerNextNonce) {
      throw new Error(
        `signer ${signerAddress} next nonce ${signerNextNonce} is less than to passed nonce of ${data.nonce}`
      );
    }

    const signedTransaction = await signer.signTransaction(signerPopulatedTx);

    const preCalculatedHash = ethers.utils.keccak256(signedTransaction);

    return {
      txHash: preCalculatedHash,
      signedTransaction,
    };
  }

  public populateTransaction(
    functionName: string,
    data: any[],
    options: {
      gasPrice: string;
      signer?: Signer;
    }
  ): Promise<ethers.PopulatedTransaction> {
    let contract = this.contract;

    if (options.signer) {
      contract = new Contract(this.address, this.abi, options.signer);
    }

    return contract.populateTransaction[functionName](...data, {
      gasPrice: options.gasPrice,
    });
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
