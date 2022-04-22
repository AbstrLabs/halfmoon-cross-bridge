import { KeyPair, connect, keyStores, utils } from 'near-api-js';

import { ENV } from '../../utils/dotenv';
import { GenericTxInfo } from '../..';
import { mint } from './mint-handler';

const TIMEOUT_30S = 30_000;

describe('mint test', () => {
  it(
    'should mint NEAR from NEAR to ALGO',
    async () => {
      // simulate frontend: make NEAR txn
      const keyStore = new keyStores.InMemoryKeyStore();
      const keyPair = KeyPair.fromString(ENV.NEAR_EXAMPL_PRIV);
      await keyStore.setKey('testnet', ENV.NEAR_EXAMPL_ADDR, keyPair);

      const config = {
        networkId: 'testnet',
        keyStore: keyStore,
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
        headers: {},
      };

      const near = await connect(config);
      const account = await near.account(ENV.NEAR_EXAMPL_ADDR);
      const response = await account.sendMoney(
        'abstrlabs.testnet', // receiver account
        utils.format.parseNearAmount('1') // amount in yoctoNEAR
      );

      console.log('response : ', response); // DEV_LOG_TO_REMOVE

      // call API
      // const from = ENV.NEAR_EXAMPL_ADDR;
      // const to = ENV.ALGO_EXAMPL_ADDR;
      // const amount = '10000000000';
      // const txId = '0x0';
      // const genericTxInfo: GenericTxInfo = {
      //   from,
      //   to,
      //   amount,
      //   txId,
      // };
      // await mint(genericTxInfo);
    },
    TIMEOUT_30S
  );
});
