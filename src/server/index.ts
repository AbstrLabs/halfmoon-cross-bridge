export { WELCOME_JSON };

// import PackageJson from "../../package.json";
const WELCOME_JSON = {
  MESSAGE: 'Welcome to the Algorand-NEAR bridge API',
  FRONTEND: 'http://halfmooncross.com/',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
  API_VERSION: require('../../package.json').version,
  API_SERVER: 'http://api.halfmooncross.com/',
  API_ENDPOINT: [
    {
      URL: 'http://api.halfmooncross.com/algorand-near',
      METHOD: 'POST',
      PARAMS: {
        type: 'literal("MINT","BURN")',
        from: 'string',
        to: 'string',
        amount: 'string',
        txnId: 'string',
      },
    },
  ],
};
