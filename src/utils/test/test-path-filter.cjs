// this file is not working. added to git just to store it.

const { writeFileSync } = require('fs');

module.exports = (testPaths) => {
  const allowedPaths = testPaths;
  writeFileSync(__dirname + '/tmp.txt', allowedPaths);
  return {
    filtered: allowedPaths,
  };
};

// 'use strict';
// module.exports = (testPaths) => {
//   // const allowedPaths = testPaths.filter(filteringFunction);
//   return { filtered: testPaths };
//   return {
//     filtered: allowedPaths,
//   };
// };
// function filteringFunction(path) {
//   // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
//   return true; // && noIntegration(path);
// }
// const noIntegration = (path) => {
//   return !path.includes('integration-test');
// };
