import { BlockchainNameToClass } from "./blockchain"
import { Transaction, TransactionStatus } from "./blockchain/base"
import { RequestForVerify, TokenAndFee, VerifyResult, RequestForCreatingOutgoing, RequestForSendingOutgoing, OutgoingResult } from "./types"
import { StateMachine } from "./StateMachine"
import { backoff } from "./utils"

const {, txn, pool, poolQuery1, clientQuery1} = require('artificio-bridge-database')
const log = require('aritficio-bridge-common/logger')

async function verify(request: RequestForVerify, tokenAndFee: TokenAndFee): Promise<VerifyResult> {
    // check signature

    // check fee
    let feeAmount = BigInt(request.from_amount_atom)*BigInt(tokenAndFee.margin_fee_atom)+BigInt(tokenAndFee.fixed_fee_atom)
    let to_amount_atom = BigInt(request.from_amount_atom)-feeAmount
    if (to_amount_atom <= 0n) {
        return {
            valid: false,
            invalidReason: 'insufficient amount',
        }
    }

    // check to address valid
    if (!await tokenAndFee.to_token_blockchain.addressIsValid(request.to_addr)) {
        return {
            valid: false,
            invalidReason: 'invalid to address',
        }
    }

    // check incoming transaction valid
    if(!await tokenAndFee.from_token_blockchain.verifyIncomingTransaction(request.from_txn_hash)) {
        return {
            valid: false,
            invalidReason: 'invalid incoming transaction',
        }
    }

    return {
        valid: true,
        to_amount_atom: to_amount_atom.toString()
    }
}

async function createOutgoing(request: RequestForCreatingOutgoing, tokenAndFee: TokenAndFee): Promise<Transaction> {
    return await tokenAndFee.to_token_blockchain.createTransactionObject({...request, to_token_addr: tokenAndFee.to_token_addr})
}

async function sendOutgoing(request: RequestForSendingOutgoing, tokenAndFee: TokenAndFee): Promise<OutgoingResult> {
    let status = await tokenAndFee.to_token_blockchain.checkTransactionStatus(request.to_txn_hash)
    if (status == TransactionStatus.NotExist) {
        // not sent, or sending was failed.
        await tokenAndFee.to_token_blockchain.sendTransaction(request.to_txn_bytes)
    }
    
    return await backoff(5, async () => {
        let status = await tokenAndFee.to_token_blockchain.checkTransactionStatus(request.to_txn_hash)
        if (status == TransactionStatus.Failed) {
            // todo: get the real reason
            return {success: false, failReason: 'failed'}
        } else if (status == TransactionStatus.Confirmed) {
            return {success: true}
        } else {
            throw new Error('not finished')
        }
    }, tokenAndFee.to_token_blockchain.txnGoThroughTime * 1000)
}

export async function worker(): Promise<boolean> {
    return await txn(async (client: any) => {
        let request = await clientQuery1(client, {readRequestToProcess: {}})
        let s = new StateMachine(client)
        if (request === undefined) {
            log.info('No requests to process')
            return false
        }
        let tokenAndFee = await poolQuery1({readTokenAndFee: {from_token_id: request.from_token_id, to_token_id: request.to_token_id}})
        tokenAndFee.from_token_blockchain = BlockchainNameToClass.get(tokenAndFee.from_token_blockchain)
        tokenAndFee.to_token_blockchain = BlockchainNameToClass.get(tokenAndFee.to_token_blockchain)

        switch (request.request_status) {
            case 'CREATED': {
                let verifyResult: VerifyResult
                try {
                    verifyResult = await verify(request, tokenAndFee)
                } catch (err) {
                    log.error('Error in verify: ', err)
                    await s.verifyError((err as Error).message)
                    return true
                }
    
                if (verifyResult.valid) {
                    await s.verifySuccess(verifyResult.to_amount_atom as string)
                } else {
                    await s.verifyInvalid(verifyResult.invalidReason as string)
                }
                return true
            }
            case 'DONE_VERIFY': {
                let txn = await createOutgoing(request, tokenAndFee)
                await s.outgoingCreated(txn.txn_hash, txn.txn_bytes)
                return true
            }
            case 'DOING_OUTGOING': {
                let outgoingResult = await sendOutgoing(request, tokenAndFee)
                if (outgoingResult.success) {
                    await s.outgoingSuccess()
                } else {
                    await s.outgoingError(outgoingResult.failReason as string)
                }
                return true
            }
            default:
                // unreachable
                
        }
    })
}
