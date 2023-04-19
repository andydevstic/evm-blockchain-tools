import tronWeb from 'tronweb';

export function parseTronTxResult(txData: any): any {
  const {
    txInfo: { blockNumber },
    txData: {
      raw_data: {
        contract: [contractData],
      },
    },
  } = txData;

  const {
    parameter: {
      value: { data: rawData, owner_address, contract_address },
    },
    type: contractType,
  } = contractData;

  if (contractType !== 'TriggerSmartContract') {
    throw new Error('invalid contract type');
  }

  return {
    from: tronWeb.address.fromHex(owner_address),
    to: tronWeb.address.fromHex(contract_address),
    blockNumber,
    data: `0x${rawData}`,
    value: 0,
  };
}
