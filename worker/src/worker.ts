import { BlockchainNameToClass } from "./blockchain";
import { VerifyResult } from "./types";
import { StateMachine } from "./StateMachine";
import { verify } from "./verify";
import { createOutgoing, sendOutgoing } from "./outgoing";

const { txn, poolQuery1, clientQuery1 } = require("halfmoon-cross-bridge-database");
const { unreachable } = require("halfmoon-cross-bridge-common/error");
const log = require("halfmoon-cross-bridge-common/logger");

export async function worker(): Promise<boolean> {
    try {
        return await txn(async (client: any) => {
            let request = await clientQuery1(client, { readRequestToProcess: {} });
            if (request === undefined) {
                log.debug("No requests to process");
                return false;
            }

            log.debug("Processing request:");
            log.debug(JSON.stringify(request, null, 2));

            let s = new StateMachine(client, request.id);
            let tokenAndFee = await poolQuery1({
                readTokenAndFee: {
                    from_token_id: request.from_token_id,
                    to_token_id: request.to_token_id,
                },
            });
            if (!tokenAndFee) {
                await s.verifyInvalid("Unsupported pair to bridge");
                return true;
            }
            tokenAndFee.from_token_blockchain = BlockchainNameToClass.get(tokenAndFee.from_token_blockchain);
            tokenAndFee.to_token_blockchain = BlockchainNameToClass.get(tokenAndFee.to_token_blockchain);

            switch (request.request_status) {
                case "CREATED": {
                    let verifyResult: VerifyResult;
                    try {
                        verifyResult = await verify(request, tokenAndFee);
                    } catch (err) {
                        console.error(err);
                        await s.verifyError((err as Error).message);
                        return true;
                    }

                    if (verifyResult.valid) {
                        await s.verifySuccess(verifyResult.successData!);
                    } else {
                        await s.verifyInvalid(verifyResult.invalidReason as string);
                    }
                    return true;
                }
                case "DONE_VERIFY": {
                    let txn = await createOutgoing(request, tokenAndFee);
                    await s.outgoingCreated(txn.txn_hash, txn.txn_bytes);
                    return true;
                }
                case "DOING_OUTGOING": {
                    let outgoingResult;
                    try {
                        outgoingResult = await sendOutgoing(request, tokenAndFee);
                    } catch (err: any) {
                        await s.outgoingError((err as Error).message);
                        return true;
                    }
                    if (outgoingResult.success) {
                        await s.outgoingSuccess();
                    } else {
                        await s.outgoingError(outgoingResult.failReason as string);
                    }
                    return true;
                }
                default:
                    unreachable();
            }
        });
    } catch (err: any) {
        log.error("Error in worker: ");
        console.error(err);
        return false;
    }
}
