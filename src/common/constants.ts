import { BigNumber } from "ethers";

export enum APP_NETWORK {
  ETH = "mainnet",
  ETHEREUM_MAINNET = "eth",
  GOERLI = "goerli",
  TRON = "trc",
  BINANCE = "bsc",
  BINANCE_TESTNET = "bnbt",
}

export enum TransactionStatus {
  SCHEDULED = "scheduled",
  EXECUTED = "executed",
  FAILED = "failed",
}

export enum TransactionReceiptStatus {
  SUCCESS = 1,
}

export enum BlockchainTransactionError {
  TIMEOUT = "timeout",
  FORCED_TIMEOUT = "force_timeout",
  TX_ERROR = "transaction_error",
  SERVER_ERROR = "server_error",
  TX_REJECTED = "tx_rejected",
}

export const MinGas = BigNumber.from("3000000000"); // 3.0 Gwei
export const AdditionalGas = BigNumber.from("1000000000"); // 1 Gwei

export enum ACCEPTED_CURRENCY {
  USDT = "USDT",
  USC = "USC",
}

export const PRIVATE_KEY_SHARD_SIZE = 27;

export enum ERC20_FN_SIGNATURE {
  TRANSFER = "transfer(address,uint256)",
  SWAP_AND_ADD_USC = "swapAndAddUSC(uint256)",
  SWAP_AND_ADD_USDT = "swapAndAddUSDT(uint256)",
}

export const ERR_CODE = {
  INVALID_TRANSFER_AMOUNT: "INVALID_TRANSFER_AMOUNT".toLowerCase(),
  WALLET_NOT_FOUND: "WALLET_NOT_FOUND".toLowerCase(),
  INVALID_ADMOUNT_DATA: "INVALID_ADMOUNT_DATA".toLowerCase(),
  INVALID_SIGNER_ADDRESS: "INVALID_SIGNER_ADDRESS".toLowerCase(),
  NOT_TRANSFER_METHOD: "NOT_TRANSFER_METHOD".toLowerCase(),
  INVALID_DESTINATION_ADDRESS: "INVALID_DESTINATION_ADDRESS".toLowerCase(),
  INVALID_CURRENCY_OR_AMOUNT: "INVALID_CURRENCY_OR_AMOUNT".toLowerCase(),
  CONFIRMATION_TOO_LOW: "CONFIRMATION_TOO_LOW".toLowerCase(),
  NO_SEND_TX_METHOD: "NO_SEND_TX_METHOD".toLowerCase(),
};

export enum BLOCKCHAIN_CHAIN {
  ETH = "eth",
  TRON = "trc",
  BINANCE = "bsc",
}

export enum TOKEN_STANDARD {
  ERC20 = "erc20",
  BEP20 = "bep20",
  TRC20 = "trc20",
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
  HOMESTEAD = "homestead",
  GOERLI = "goerli",
  SEPOLIA = "sepolia",
  MATIC = "matic",
  MACTIMUM = "maticmum",
  ARBITRUM = "arbitrum",
  ARBITRUM_GOERLI = "arbitrum-goerli",
  OPTIMISM = "optimism",
  OPTIMISM_GOERLI = "optimism-goerli",
}

export const OneEtherZeros = "000000000000000000";
export const EMPTY_DATA = "0x";
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
