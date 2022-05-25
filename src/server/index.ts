export { WELCOME_JSON };

const WELCOME_JSON = {
  MESSAGE: 'Welcome to the Algorand-NEAR bridge API',
  FRONTEND: 'http://halfmooncross.com/',
  API_VERSION: '0.1.0',
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
