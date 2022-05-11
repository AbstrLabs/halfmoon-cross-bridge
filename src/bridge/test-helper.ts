export { transferOnNearTestnetFromExampleToMaster };

import { KeyPair, connect, keyStores, utils } from 'near-api-js';

import { ENV } from '../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';

async function transferOnNearTestnetFromExampleToMaster(
  amountInNEAR: string
): Promise<FinalExecutionOutcome> {
  return transferOnNearTestnet(
    ENV.NEAR_EXAMPL_PRIV,
    ENV.NEAR_EXAMPL_ADDR,
    ENV.NEAR_MASTER_ADDR,
    amountInNEAR
  );
}
async function transferOnNearTestnet(
  fromPrivKey: string,
  fromAddr: string,
  toAddr: string,
  amountInNEAR: string
): Promise<FinalExecutionOutcome> {
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(fromPrivKey);
  await keyStore.setKey('testnet', fromAddr, keyPair);

  const config = {
    networkId: 'testnet',
    keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    headers: {},
  };

  const near = await connect(config);
  const account = await near.account(fromAddr);
  const response = await account.sendMoney(
    toAddr, // receiver account
    utils.format.parseNearAmount(amountInNEAR) // amount in yoctoNEAR
  );

  return response;
}
