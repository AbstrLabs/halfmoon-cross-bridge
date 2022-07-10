// TODO: purge logger. too many info on Mint/burn
export {
  BlockchainName,
  BridgeTxnStatusEnum,
  BridgeTxnStatusTree,
  BridgeTxnActionName,
  NodeEnvEnum,
};

enum BridgeTxnActionName {
  // create in DB
  confirmIncomingTxn = 'confirmIncomingTxn',
  makeOutgoingTxn = 'makeOutgoingTxn',
  verifyOutgoingTxn = 'verifyOutgoingTxn',
}

enum BlockchainName {
  NEAR = 'NEAR',
  ALGO = 'ALGO',
}

enum BridgeTxnStatusEnum {
  // By order
  NOT_CREATED = 'NOT_CREATED', //                   Only used in ram
  ERR_SEVER_INTERNAL = 'ERR_SEVER_INTERNAL', //     General server internal error
  ERR_AWS_RDS_DB = 'ERR_AWS_RDS_DB', //             General AWS DB External error
  DOING_INITIALIZE = 'DOING_INITIALIZE', //         BridgeTxn without calling initialize
  ERR_INITIALIZE = 'ERR_INITIALIZE', //             BridgeTxn initialize failed
  DONE_INITIALIZE = 'DONE_INITIALIZE', //           BridgeTxn after initialize
  DOING_INCOMING = 'DOING_INCOMING', //             Await confirm incoming
  ERR_VERIFY_INCOMING = 'ERR_VERIFY_INCOMING', //   Verified incoming is wrong
  ERR_TIMEOUT_INCOMING = 'ERR_TIMEOUT_INCOMING', // Confirm incoming timeout
  DONE_INCOMING = 'DONE_INCOMING', //               Confirm incoming success
  DOING_OUTGOING = 'DOING_OUTGOING', //             Await confirm outgoing txn
  ERR_MAKE_OUTGOING = 'ERR_MAKE_OUTGOING', //       Make outgoing txn failed
  DOING_VERIFY = 'DOING_VERIFY', //                 Await verify outgoing txn
  ERR_CONFIRM_OUTGOING = 'ERR_CONFIRM_OUTGOING', // Confirm outgoing timeout
  DONE_OUTGOING = 'DONE_OUTGOING', //               Confirm outgoing success
  USER_CONFIRMED = 'USER_CONFIRMED', //             User confirmed
}

// TODO: [BTST] ref: move BridgeTxnStatusTree to a new file
// TODO: use symbolic name or enum
type ActionName = 'MANUAL' | BridgeTxnActionName | null;
/**
 * When actionName is null, there's no action to take,
 * hence can be treated as finished. (TODO: DOING_INITIALIZE etc)
 */
class BridgeTxnStatus {
  name: BridgeTxnStatusEnum;
  isError: boolean;
  previous: BridgeTxnStatusEnum | null; // null means first status
  actionName: ActionName;

  constructor({
    status,
    previous,
    actionName,
  }: {
    status: BridgeTxnStatusEnum;
    previous: BridgeTxnStatusEnum | null;
    actionName: ActionName;
  }) {
    this.name = status;
    this.previous = previous;
    this.isError = status.toString().startsWith('ERR_');
    if (this.isError) {
      actionName = 'MANUAL';
    }
    this.actionName = actionName;
  }
  get value() {
    return this.name;
  }
  toString() {
    return this.name.toString();
  }
}

const BridgeTxnStatusTree = {
  [BridgeTxnStatusEnum.NOT_CREATED]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.NOT_CREATED,
    previous: null,
    actionName: null,
  }),
  [BridgeTxnStatusEnum.ERR_SEVER_INTERNAL]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_SEVER_INTERNAL,
    previous: BridgeTxnStatusEnum.NOT_CREATED,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.ERR_AWS_RDS_DB]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_AWS_RDS_DB,
    previous: BridgeTxnStatusEnum.NOT_CREATED,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.DOING_INITIALIZE]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DOING_INITIALIZE,
    previous: BridgeTxnStatusEnum.NOT_CREATED,
    actionName: null,
  }),
  [BridgeTxnStatusEnum.ERR_INITIALIZE]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_INITIALIZE,
    previous: BridgeTxnStatusEnum.DOING_INITIALIZE,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.DONE_INITIALIZE]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DONE_INITIALIZE,
    previous: BridgeTxnStatusEnum.DOING_INITIALIZE,
    actionName: BridgeTxnActionName.confirmIncomingTxn,
  }),

  [BridgeTxnStatusEnum.DOING_INCOMING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DOING_INCOMING,
    previous: BridgeTxnStatusEnum.DONE_INITIALIZE,
    actionName: BridgeTxnActionName.confirmIncomingTxn, // ? DOING-> null
  }),
  [BridgeTxnStatusEnum.ERR_VERIFY_INCOMING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_VERIFY_INCOMING,
    previous: BridgeTxnStatusEnum.DOING_INCOMING,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING,
    previous: BridgeTxnStatusEnum.DOING_INCOMING,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.DONE_INCOMING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DONE_INCOMING,
    previous: BridgeTxnStatusEnum.DOING_INCOMING,
    actionName: BridgeTxnActionName.makeOutgoingTxn,
  }),
  [BridgeTxnStatusEnum.DOING_OUTGOING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DOING_OUTGOING,
    previous: BridgeTxnStatusEnum.DONE_INCOMING,
    actionName: BridgeTxnActionName.verifyOutgoingTxn,
  }),
  // TODO: should move DONE_OUTGOING here and add a DONE_VERIFY status
  // TODO: +Currently using DOING_OUTGOING as DONE_OUTGOING
  [BridgeTxnStatusEnum.ERR_MAKE_OUTGOING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_MAKE_OUTGOING,
    previous: BridgeTxnStatusEnum.DOING_OUTGOING,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.DOING_VERIFY]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DOING_VERIFY,
    previous: BridgeTxnStatusEnum.DOING_OUTGOING,
    actionName: BridgeTxnActionName.verifyOutgoingTxn,
  }),
  [BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING,
    previous: BridgeTxnStatusEnum.DOING_VERIFY,
    actionName: 'MANUAL',
  }),
  [BridgeTxnStatusEnum.DONE_OUTGOING]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.DONE_OUTGOING,
    previous: BridgeTxnStatusEnum.DOING_VERIFY,
    actionName: null, // TODO: send email to user, if no email or no confirm in X days, move to USER_CONFIRMED
  }),
  [BridgeTxnStatusEnum.USER_CONFIRMED]: new BridgeTxnStatus({
    status: BridgeTxnStatusEnum.USER_CONFIRMED,
    previous: BridgeTxnStatusEnum.DONE_OUTGOING,
    actionName: null,
  }),
};

enum NodeEnvEnum {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test', // jest use "test", not "testing" from https://jestjs.io/docs/environment-variables#node_env
}
