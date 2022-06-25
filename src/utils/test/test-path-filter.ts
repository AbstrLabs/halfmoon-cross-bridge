// this file is not working. added to git just to store it.

module.exports = (testPaths: string[]) => {
  const allowedPaths = testPaths.filter(filteringFunction);
  return {
    filtered: allowedPaths,
  };
};

function filteringFunction(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return true && noIntegration(path);
}

const noIntegration = (path: string) => {
  return !path.includes('/integration-test/');
};
