import { db } from '../../database/db';
import { jest } from '@jest/globals';

module.exports = async function (
  globalConfig: any, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  projectConfig: any // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
) {
  console.log(globalConfig.testPathPattern);
  // console.log(projectConfig);

  // Set reference to mongod in order to close the server during teardown.
  // globalThis.__MONGOD__ = mongod;
  process.on('unhandledRejection', (reason) => {
    console.log(reason); // log the reason including the stack trace
    // throw e;
  });
  await db.connect();
  console.log('db : ', db); // DEV_LOG_TO_REMOVE
  jest.mock('../../database/db', () => ({ db }));
};
