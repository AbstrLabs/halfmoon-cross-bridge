import { BlockchainName } from '..';
import { Blockchain } from './abstract-base';
import { algoBlockchain } from './algorand';
import { nearBlockchain } from './near';

export { BLOCKCHAIN_MAP };
const BLOCKCHAIN_MAP: Record<BlockchainName, Blockchain> = {
  [BlockchainName.ALGO]: algoBlockchain,
  [BlockchainName.NEAR]: nearBlockchain,
};
