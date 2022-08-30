import { algoBlockchain } from "./algorand";
import { Blockchain } from "./base";
import { nearBlockchain } from "./near";

export const BlockchainNameToClass = new Map<string, Blockchain>([
    ['Algorand', algoBlockchain],
    ['NEAR', nearBlockchain],
])