import { expect } from "chai";
import sinon from "sinon";

import { AlchemyGateway } from "../../src/gateways/alchemy-gateway";
import { BlockchainService } from "../../src/services/blockchain-service";
import * as constants from "../../src/common/constants";

describe("BlockchainService", () => {
  it("should be able to get a transaction by ID", async () => {
    const web3Gateway = new AlchemyGateway({
      apiKey: "123",
      network: constants.ALCHEMY_NETWORK.HOMESTEAD,
      privateKey:
        "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f",
    });

    const stubbed = sinon.stub(web3Gateway, "getTransactionByID").returns(
      Promise.resolve({
        data: "0x123123",
      })
    );

    const blockchainService = new BlockchainService(web3Gateway);

    const txID = "0x1234";
    const txData = await blockchainService.getTransactionById(txID);

    expect(stubbed.calledOnce).to.be.true;
    expect(txData.data).to.eq("0x123123");
  });
});
