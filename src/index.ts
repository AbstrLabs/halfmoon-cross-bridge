import { BridgeTxnActionName } from './bridge/bridge-txn';

// TODO: purge logger. too many info on Mint/burn
export { BlockchainName, BridgeTxnStatusEnum, BridgeTxnStatusTree };

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

class BridgeTxnStatus {
  status: BridgeTxnStatusEnum;
  isError: boolean;
  previous: BridgeTxnStatusEnum | null;
  actionName: 'MANUAL' | BridgeTxnActionName | null;

  constructor(
    status: BridgeTxnStatusEnum,
    previous: BridgeTxnStatusEnum | null
  ) {
    this.status = status;
    this.previous = previous;
    this.isError = status.toString().startsWith('ERR_');
    let actionName: typeof this.actionName;
    if (this.isError) {
      // TODO: use symbolic name or enum
      actionName = 'MANUAL';
    }
    switch (status) {
      case BridgeTxnStatusEnum.NOT_CREATED:
        actionName = null;
        break;
      case BridgeTxnStatusEnum.ERR_SEVER_INTERNAL:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.ERR_AWS_RDS_DB:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.DOING_INITIALIZE:
        actionName = null;
        break;
      case BridgeTxnStatusEnum.ERR_INITIALIZE:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.DONE_INITIALIZE:
        actionName = BridgeTxnActionName.confirmIncomingTxn;
        break;
      case BridgeTxnStatusEnum.DOING_INCOMING:
        actionName = BridgeTxnActionName.confirmIncomingTxn;
        break;
      case BridgeTxnStatusEnum.ERR_VERIFY_INCOMING:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.DONE_INCOMING:
        actionName = BridgeTxnActionName.makeOutgoingTxn;
        break;
      case BridgeTxnStatusEnum.DOING_OUTGOING:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.ERR_MAKE_OUTGOING:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.DOING_VERIFY:
        actionName = BridgeTxnActionName.verifyOutgoingTxn;
        break;
      case BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING:
        actionName = 'MANUAL';
        break;
      case BridgeTxnStatusEnum.DONE_OUTGOING:
        actionName = null;
        break;
      case BridgeTxnStatusEnum.USER_CONFIRMED:
        actionName = null;
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Unknown status: ${status}`);
    }
    this.actionName = actionName;
  }
  get value() {
    return this.status;
  }
  toString() {
    return this.status.toString();
  }
}

const BridgeTxnStatusTree = {
  [BridgeTxnStatusEnum.NOT_CREATED]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.NOT_CREATED,
    null
  ),
  [BridgeTxnStatusEnum.ERR_SEVER_INTERNAL]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_SEVER_INTERNAL,
    BridgeTxnStatusEnum.NOT_CREATED
  ),
  [BridgeTxnStatusEnum.ERR_AWS_RDS_DB]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_AWS_RDS_DB,
    BridgeTxnStatusEnum.NOT_CREATED
  ),
  [BridgeTxnStatusEnum.DOING_INITIALIZE]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DOING_INITIALIZE,
    BridgeTxnStatusEnum.NOT_CREATED
  ),
  [BridgeTxnStatusEnum.DONE_INITIALIZE]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DONE_INITIALIZE,
    BridgeTxnStatusEnum.DOING_INITIALIZE
  ),
  [BridgeTxnStatusEnum.ERR_INITIALIZE]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_INITIALIZE,
    BridgeTxnStatusEnum.DOING_INITIALIZE
  ),
  [BridgeTxnStatusEnum.DOING_INCOMING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DOING_INCOMING,
    BridgeTxnStatusEnum.DONE_INITIALIZE
  ),
  [BridgeTxnStatusEnum.ERR_VERIFY_INCOMING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_VERIFY_INCOMING,
    BridgeTxnStatusEnum.DOING_INCOMING
  ),
  [BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING,
    BridgeTxnStatusEnum.DOING_INCOMING
  ),
  [BridgeTxnStatusEnum.DONE_INCOMING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DONE_INCOMING,
    BridgeTxnStatusEnum.DOING_INCOMING
  ),
  [BridgeTxnStatusEnum.DOING_OUTGOING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DOING_OUTGOING,
    BridgeTxnStatusEnum.DONE_INCOMING
  ),
  [BridgeTxnStatusEnum.ERR_MAKE_OUTGOING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_MAKE_OUTGOING,
    BridgeTxnStatusEnum.DOING_OUTGOING
  ),
  [BridgeTxnStatusEnum.DOING_VERIFY]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DOING_VERIFY,
    BridgeTxnStatusEnum.DOING_OUTGOING
  ),
  [BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING,
    BridgeTxnStatusEnum.DOING_VERIFY
  ),
  [BridgeTxnStatusEnum.DONE_OUTGOING]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.DONE_OUTGOING,
    BridgeTxnStatusEnum.DOING_VERIFY
  ),
  [BridgeTxnStatusEnum.USER_CONFIRMED]: new BridgeTxnStatus(
    BridgeTxnStatusEnum.USER_CONFIRMED,
    BridgeTxnStatusEnum.DONE_OUTGOING
  ),
};
