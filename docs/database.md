## Columns

Tables have the following columns

| Name             | Type                     | Description                    |
| ---------------- | ------------------------ | ------------------------------ |
| db_id            | SERIAL PRIMARY KEY       | The unique id of the database  |
| txn_status       | txn_status_enum NOT NULL | The status of the txn          |
| created_time     | BIGINT NOT NULL          | The time the txn was created   |
| from_addr        | VARCHAR(63) NOT NULL     | The address of the sender      |
| from_amount_atom | BIGINT NOT NULL          | The amount of the "from" txn   |
| from_token_id    | NUMBER NOT NULL          | The token id of the "from" txn |
| from_txn_id      | VARCHAR(63) NOT NULL     | The txn id of the "from" txn   |
| to_addr          | VARCHAR(63) NOT NULL     | The address of the receiver    |
| to_amount_atom   | BIGINT NOT NULL          | The amount of the "to" txn     |
| to_token_id      | NUMBER NOT NULL          | The token id of the "to" txn   |
| to_txn_id        | VARCHAR(63)              | The txn id of the "to" txn     |
| comments         | VARCHAR(255)             | Backup column                  |
| txn_type         | txn_type_enum NOT NULL   | The type of the txn            |
| fixed_fee_atom   | BIGINT NOT NULL          | The fixed fee of the txn       |
| margin_fee_atom  | BIGINT NOT NULL          | The margin fee of the txn      |

- VARCHAR is an alias for CHARACTER VARYING ([Doc](https://www.postgresql.org/docs/current/datatype-character.html))
- Added "txn_type" back although having "token_id"s for the convenience. Fields after "comments" can be deduced by the other fields.

## Database

We use one database for all the data.
To avoid filtering all entries, we use INDEX (doc) instead of splitting the database into multiple tables.

## Backup plan

To have 3 sets of tables:

- Mainnet
- Testnet
- Dev

Each set has the following tables

## Tables

Every table name is appended with `_mainnet`, `_testnet`, `_dev`.
They have same columns, and the primary key is

- `requests`: the primary table to store requests,
- `pending`: store unfinished task
- `manual`: store errors that needs manual handling
- `finished`: store finished task
