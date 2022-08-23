import { algoBlockchain } from "./algorand";
import { nearBlockchain } from "./near";

export const BlockchainNameToClass = new Map([
    ['Algorand', algoBlockchain],
    ['NEAR', nearBlockchain],
])