import { BlockchainNameToClass } from "./blockchain"
import { Blockchain, Transaction, TransactionStatus } from "./blockchain/base"

const {sql, txn, pool, poolQuery1, clientQuery1} = require('artificio-bridge-database')
const log = require('aritficio-bridge-common/logger')

interface RequestForVerify {
    from_amount_atom: string
    from_addr: string
    from_txn_hash: string
    from_txn_hash_sig: string

    to_addr: string
}

interface VerifyResult {
    valid: boolean
    to_amount_atom?: string
    invalidReason?: string
}

interface RequestForCreatingOutgoing {
    to_addr: string
    to_amount_atom: string
}

interface RequestForSendingOutgoing {
    to_txn_hash: string
    to_txn_bytes: Uint8Array
}

interface OutgoingResult {
    success: boolean
    failReason?: string
}

interface TokenAndFee {
    from_token_id: number
    to_token_id: number
    from_token_name: string
    to_token_name: string
    from_token_blockchain: Blockchain
    to_token_blockchain: Blockchain
    from_token_addr: string | null
    to_token_addr: string | null
    fixed_fee_atom: string
    margin_fee_atom: string
}

/**
 * Asynchronously function pause for a certain time in milliseconds.
 *
 * @param ms - Milliseconds to pause
 * @returns
 */
async function pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const retry = (retries: number, fn: Function) => fn().catch((err: any) => retries > 1 ? retry(retries - 1, fn) : Promise.reject(err));
const backoff = (retries: number, fn: Function, delay = 500) =>
    fn().catch((err: any) => retries > 1
        ? pause(delay).then(() => backoff(retries - 1, fn, delay * 2))
        : Promise.reject(err));

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

class StateMachine {
    constructor(private client: any) {}

    async verifyInvalid(reason: string) {
        await this.client.query(sql.updateRequestCreatedToInvalid({reason}))
    }

    async verifySuccess(to_amount_atom: string) {
        await this.client.query(sql.updateRequestCreatedToDoneVerify({to_amount_atom}))
    }

    async verifyError(errorMsg: string) {
        await this.client.query(sql.updateRequestCreatedToErrorInVerify({errorMsg}))
    }

    async outgoingCreated(to_txn_hash: string, to_txn_bytes: Uint8Array) {
        await this.client.query(sql.updateRequestDoneVerifyToDoingOutgoing({to_txn_hash, to_txn_bytes}))
    }

    async outgoingSuccess() {
        await this.client.query(sql.updateRequestDoingOutgoingToDoneOutgoing())
    }

    async outgoingError(errorMsg: string) {
        await this.client.query(sql.updateRequestDoingOutgoingToErrorInOutgoing({errorMsg}))
    }
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

        if (request.requst_status == 'CREATED') {
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
        } else if (request.request_status == 'DONE_VERIFY') {
            let txn = await createOutgoing(request, tokenAndFee)
            await s.outgoingCreated(txn.txn_hash, txn.txn_bytes)
            return true
        } else if (request.request_status == 'DOING_OUTGOING') {
            let outgoingResult = await sendOutgoing(request, tokenAndFee)
            if (outgoingResult.success) {
                await s.outgoingSuccess()
            } else {
                await s.outgoingError(outgoingResult.failReason as string)
            }
            return true
        }
        // unreachable
    })
}
