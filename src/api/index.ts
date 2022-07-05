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
      BODY: {
        type: ['literal("MINT","BURN")', 'case sensitive'],
        from: ['string', 'public address of the sender'],
        to: ['string', 'public address of the receiver'],
        amount: ['string', 'up to 10 decimal places'],
        txnId: ['string', 'transaction ID'],
      },
    },
    {
      URL: 'https://api.halfmooncross.com/algorand-near',
      METHOD: 'GET',
      PARAMS: {
        uid: ['string', 'in form {number}.{txnId}'],
      },
    },
  ],
  ADDITIONAL_INFO: {
    SERVER_UP_TIMESTAMP: new Date().toISOString(),
  },
};
