/**
 * Test helper used across tests.
 *
 * @todo: move to utils/test
 */

export { simulatedFrontendNearToGoNear };

import { KeyPair, connect, keyStores, utils } from 'near-api-js';

import { ENV } from '../../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { MintApiParam } from '../../utils/type';
import { NearTxnId, TxnType } from '../../blockchain';

/**
 * Simulate frontend: make NEAR -> goNEAR mint txn, returning an API call param.
 * @param amountInNEAR amount in NEAR
 * @returns - {@link: MintApiParam}
 */
async function simulatedFrontendNearToGoNear(
  amountInNEAR: string
): Promise<MintApiParam> {
  const mintResponse = await transferOnNearTestnetFromExampleToMaster(
    amountInNEAR
  );

  // TODO(#TNFT): Type FinalExecutionOutcome.transaction.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
  const nearTxnId = mintResponse?.transaction?.hash as NearTxnId | undefined; // or mintResponse.transaction_outcome.id;

  if (nearTxnId === undefined) {
    throw Error('no transaction hash');
  }
  const apiCallParam: MintApiParam = {
    amount: amountInNEAR,
    type: TxnType.MINT,
    from: ENV.NEAR_EXAMPL_ADDR,
    to: ENV.ALGO_EXAMPL_ADDR,
    txnId: nearTxnId,
  };

  return apiCallParam;
}

/**
 * Transfer testnet NEAR faucet from example account to master account.
 * @inheritdoc {@Link Blockchain}
 *
 * @async
 * @param  {string} amountInNEAR
 * @returns {Promise<FinalExecutionOutcome>} promise of outcome of the transaction
 */
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

/**
 * Transfer testnet NEAR faucet from one account to another.
 *
 * @async
 * @param  {string} fromPrivKey
 * @param  {string} fromAddr
 * @param  {string} toAddr
 * @param  {string} amountInNEAR
 * @returns {Promise<FinalExecutionOutcome>} promise of outcome of the transaction
 */
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
