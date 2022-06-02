export { WELCOME_JSON };

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
const version = require('../../package.json').version as string;

const WELCOME_JSON = {
  MESSAGE: 'Welcome to the Algorand-NEAR bridge API',
  FRONTEND: 'https://halfmooncross.com/',
  API_VERSION: version,
  API_SERVER: 'https://api.halfmooncross.com/',
  API_ENDPOINT: [
    {
      URL: 'https://api.halfmooncross.com/algorand-near',
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
