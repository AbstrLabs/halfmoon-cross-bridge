// import type { Config } from '@jest/types';

module.exports = function () // globalConfig: Config.GlobalConfig
// projectConfig: Config.ProjectConfig,
{
  // globalConfig is the result of loading global config file
  // Set reference to mongod in order to close the server during teardown.
  // globalThis.__MONGOD__ = mongod;
  process.on('unhandledRejection', (reason) => {
    console.log(reason); // log the reason including the stack trace
    // throw e;
  });
  // await db.connect();
};
