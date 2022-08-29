#!/usr/bin/env bash

set -eu

SCRIPT_DIR=$(dirname "$0")
ALGO=$(node ${SCRIPT_DIR}/add-token.js --name=ALGO --blockchain=Algorand --atoms=6)
NEAR=$(node ${SCRIPT_DIR}/add-token.js --name=NEAR --blockchain=NEAR --atoms=24)
GONEAR=$(node ${SCRIPT_DIR}/add-token.js --name=goNEAR --blockchain=Algorand --addr=83251085 --atoms=10) # goNEAR's ASA ID

node ${SCRIPT_DIR}/add-fee.js --from_token_id=${NEAR} --to_token_id=${GONEAR} --bridge_type=MINT --fixed_fee_atom=1 --margin_fee_atom=0
node ${SCRIPT_DIR}/add-fee.js --from_token_id=${GONEAR} --to_token_id=${NEAR} --bridge_type=BURN --fixed_fee_atom=1 --margin_fee_atom=20
