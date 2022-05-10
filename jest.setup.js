module.exports = async function (globalConfig, projectConfig) {
  // console.log(globalConfig.testPathPattern);
  // console.log(projectConfig.cache);
  // // Set reference to mongod in order to close the server during teardown.
  // globalThis.__MONGOD__ = mongod;
  process.on('unhandledRejection', (reason) => {
    console.log(reason); // log the reason including the stack trace
    // throw e;
  });
  var { db } = await require('./src/database/db');
  db.connect();
};