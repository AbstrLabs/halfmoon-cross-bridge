DROP TYPE txn_status_enum;
DROP TYPE txn_type_enum;

-- source of truth: src/index.ts: enum BridgeTxnStatusEnum
CREATE TYPE txn_status_enum AS ENUM (
  -- 'NOT_CREATED', this should not show up in the database
  'ERR_SEVER_INTERNAL',
  'ERR_AWS_RDS_DB',
  'DOING_INITIALIZE',
  'DONE_INITIALIZE',
  'ERR_INITIALIZE',
  'DOING_INCOMING',
  'ERR_VERIFY_INCOMING',
  'ERR_TIMEOUT_INCOMING',
  'DONE_INCOMING',
  'ERR_MAKE_OUTGOING',
  'DOING_OUTGOING',
  'DOING_VERIFY',
  'ERR_CONFIRM_OUTGOING',
  'DONE_OUTGOING',
  'USER_CONFIRMED'
);

CREATE TYPE txn_type_enum AS ENUM (
  'MINT',
  'BURN'
);
