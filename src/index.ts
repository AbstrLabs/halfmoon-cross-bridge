// TODO: check {X as X} and Y : Y.

export { BlockchainName, BridgeTxnStatus };

enum BlockchainName {
  NEAR = 'NEAR',
  ALGO = 'ALGO',
}

enum BridgeTxnStatus {
  // By order
  ERR_SEVER_INTERNAL = 'ERR_SEVER_INTERNAL', //     General server internal error
  ERR_AWS_RDS_DB = 'ERR_AWS_RDS_DB', //             General AWS DB External error
  DOING_INITIALIZE = 'DOING_INITIALIZE', //         BridgeTxn without calling initialize
  DONE_INITIALIZE = 'DONE_INITIALIZE', //           BridgeTxn after initialize
  ERR_INITIALIZE = 'ERR_INITIALIZE', //             BridgeTxn initialize failed
  DOING_INCOMING = 'DOING_INCOMING', //             Await confirm incoming
  ERR_VERIFY_INCOMING = 'ERR_VERIFY_INCOMING', //   Verified incoming is wrong
  ERR_TIMEOUT_INCOMING = 'ERR_TIMEOUT_INCOMING', // Confirm incoming timeout
  DONE_INCOMING = 'DONE_INCOMING', //               Confirm incoming success
  ERR_MAKE_OUTGOING = 'ERR_MAKE_OUTGOING', //       Make outgoing txn failed
  DOING_OUTGOING = 'DOING_OUTGOING', //             Await confirm outgoing txn
  DOING_VERIFY = 'DOING_VERIFY', //                 Await verify outgoing txn
  ERR_CONFIRM_OUTGOING = 'ERR_CONFIRM_OUTGOING', // Confirm outgoing timeout
  DONE_OUTGOING = 'DONE_OUTGOING', //               Confirm outgoing success
  USER_CONFIRMED = 'USER_CONFIRMED', //             User confirmed
}
