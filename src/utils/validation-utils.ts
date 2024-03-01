import { BigNumber, ethers } from "ethers";

import * as addressUtils from "./address-utils";

import {
  TransferValidationData,
  TransferValidationResult,
} from "../common/interfaces";
import { ERC20_FN_SIGNATURE, ERR_CODE } from "../common/constants";
import { BlockchainService } from "../services";

export async function validateERC20Transfer(
  txData: ethers.providers.TransactionResponse,
  validationData: Partial<TransferValidationData>,
  blockchainService = new BlockchainService(null)
): Promise<TransferValidationResult> {
  const {
    from: executorAddress,
    to: calledContractAddress,
    data,
    value,
    confirmations,
  } = txData;
  const {
    signature,
    signContent,
    destinationAddress,
    amountData,
    minConfirmations,
  } = validationData;

  if (minConfirmations && confirmations < minConfirmations) {
    return {
      isValid: false,
      message: "confirmation too low",
      code: ERR_CODE.CONFIRMATION_TOO_LOW,
    };
  }

  // Validate signature to make sure the one submiting this is really the transaction executor
  if (signature && signContent) {
    const signerAddress = blockchainService.recoverMessageSigner(
      signContent,
      signature
    );

    if (!addressUtils.areAddressesSame(signerAddress, executorAddress)) {
      return {
        isValid: false,
        message: "signer is not transaction executor",
        code: ERR_CODE.INVALID_SIGNER_ADDRESS,
      };
    }
  }

  const { args, signature: functionName } =
    await blockchainService.parseERC20TxByNetwork(data, value, txData.hash);

  // Validate if this is Transfer function
  if (functionName !== ERC20_FN_SIGNATURE.TRANSFER) {
    return {
      isValid: false,
      message: "invalid method",
      code: ERR_CODE.NOT_TRANSFER_METHOD,
    };
  }

  // Validate if destination address is correct
  const [transferredToAddress, transferredAmount] = args;
  if (
    destinationAddress &&
    !addressUtils.areAddressesSame(transferredToAddress, destinationAddress)
  ) {
    return {
      isValid: false,
      message: "invalid method",
      code: ERR_CODE.INVALID_DESTINATION_ADDRESS,
    };
  }

  // Validates if the transferred amount is correct
  if (amountData?.length) {
    const foundValidTransferAmountData = amountData.find((data) => {
      if (
        !addressUtils.areAddressesSame(
          calledContractAddress,
          data.contractAddress
        )
      ) {
        return false;
      }

      // The amount to validate against transferredAmount
      const parsedAmount = ethers.utils.parseEther(data.amount);

      // Exact match
      if (!data.tolerancePercentage) {
        return parsedAmount.eq(transferredAmount);
      }

      // Price diff between latest price and the transferred amount
      const priceDiff = parsedAmount.sub(transferredAmount);

      if (priceDiff.eq(0)) {
        return true;
      }

      const reversed = parsedAmount.div(priceDiff).abs();

      const diffPercentage = 1 / reversed.toNumber();

      return diffPercentage * 100 <= data.tolerancePercentage;
    });

    if (!foundValidTransferAmountData) {
      return {
        isValid: false,
        message: "invalid currency or amount",
        code: ERR_CODE.INVALID_CURRENCY_OR_AMOUNT,
      };
    }

    return {
      isValid: true,
      data: {
        amountData: foundValidTransferAmountData,
      },
    };
  }

  return {
    isValid: true,
  };
}
