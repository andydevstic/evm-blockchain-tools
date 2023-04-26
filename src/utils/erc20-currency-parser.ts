import { BigNumber } from "bignumber.js";
import { ACCEPTED_CURRENCY, APP_NETWORK } from "../common/constants";

function parseCurrencyWithDecimals(
  amount: string,
  decimals: number,
  floatDecimals: number
): string {
  const BigTen = BigNumber(10).pow(decimals);

  const amountInEther = BigNumber(amount).div(BigTen).toString();

  const [a, b] = amountInEther.split(".");
  if (b?.length > 0) {
    return `${a}.${b.slice(0, floatDecimals)}`;
  }

  return amountInEther.toString();
}

export const parseERC20Currency = (
  amount: string,
  currency: ACCEPTED_CURRENCY,
  network = APP_NETWORK.ETH
): string => {
  const usdtDecimals = network === APP_NETWORK.BINANCE ? 18 : 6;

  switch (currency) {
    case ACCEPTED_CURRENCY.USC:
      return parseCurrencyWithDecimals(amount, 18, 8);
    case ACCEPTED_CURRENCY.USDT:
      return parseCurrencyWithDecimals(amount, usdtDecimals, 8);
    default:
      throw new Error("currency not supported");
  }
};
