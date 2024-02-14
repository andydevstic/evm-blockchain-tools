import { MinGas, AdditionalGas } from "../common/constants";

export const defaultFeeData = {
  maxPriorityFeePerGas: "6000000000",
  maxFeePerGas: "7000000000",
};

export const ETH_TRANSFER_GAS = 21000;

export function extractFeeData(feeData: any) {
  return {
    maxFeePerGas: feeData.maxFeePerGas.lt(MinGas)
      ? MinGas.add(AdditionalGas)
      : feeData.maxFeePerGas.add(AdditionalGas),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.lt(MinGas)
      ? MinGas
      : feeData.maxPriorityFeePerGas,
  };
}
