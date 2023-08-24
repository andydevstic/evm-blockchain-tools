import { Network } from "alchemy-sdk";

export enum APP_NETWORK {
  ETH = "mainnet",
  GOERLI = "goerli",
  TRON = "trc",
  BINANCE = "bsc",
  BINANCE_TESTNET = "bnbt",
}

export enum ACCEPTED_CURRENCY {
  USDT = "USDT",
  USC = "USC",
}

export enum MULTISIG_TX_STATUS {
  EXECUTED = "executed",
  PENDING = "pending",
  REJECTED = "rejected",
}

export enum NETWORK_IDS {
  ETH = 1,
  GOERLI = 5,
  BINANCE = 56,
  BINANCE_TESTNET = 97,
}

export enum ALCHEMY_NETWORK {
  ETH_MAINNET = "eth-mainnet",
  ETH_GOERLI = "eth-goerli",
  ETH_SEPOLIA = "eth-sepolia",
  OPT_MAINNET = "opt-mainnet",
  OPT_GOERLI = "opt-goerli",
  ARB_MAINNET = "arb-mainnet",
  ARB_GOERLI = "arb-goerli",
  MATIC_MAINNET = "polygon-mainnet",
  MATIC_MUMBAI = "polygon-mumbai",
  ASTAR_MAINNET = "astar-mainnet",
  POLYGONZKEVM_MAINNET = "polygonzkevm-mainnet",
  POLYGONZKEVM_TESTNET = "polygonzkevm-testnet",
}

export const OneEtherZeros = "000000000000000000";
export const EMPTY_DATA = "0x";
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
