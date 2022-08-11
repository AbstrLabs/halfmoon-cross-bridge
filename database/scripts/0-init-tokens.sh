#!/usr/bin/env bash

set -eu

SCRIPT_DIR=$(dirname "$0")
ALGO=$(node ${SCRIPT_DIR}/add-token.js --name=ALGO --blockchain=Algorand)
NEAR=$(node ${SCRIPT_DIR}/add-token.js --name=NEAR --blockchain=NEAR)
GONEAR=$(node ${SCRIPT_DIR}/add-token.js --name=goNEAR --blockchain=Algorand --addr=83251085) # goNEAR's ASA ID

node ${SCRIPT_DIR}/add-fee.js --from_token_id=${NEAR} --to_token_id=${GONEAR} --bridge_type=MINT --fixed_fee_atom=1 --margin_fee_atom=0
node ${SCRIPT_DIR}/add-fee.js --from_token_id=${GONEAR} --to_token_id=${NEAR} --bridge_type=BURN --fixed_fee_atom=1 --margin_fee_atom=20
