export {
  type nearAddr,
  type algoAddr,
  type addr,
  type nearTxHash,
  type algoTxnId,
  type TxID,
};

type nearAddr = string;
type algoAddr = string;
type addr = nearAddr | algoAddr;
type nearTxHash = string;
type algoTxnId = string;
type TxID = nearTxHash | algoTxnId;
