const { sql } = require('halfmoon-cross-bridge-database');
const log = require('halfmoon-cross-bridge-common/logger')

export class StateMachine {
    constructor(private client: any, private id: number) { }

    async verifyInvalid(reason: string) {
        log.debug(`Request id ${this.id} invalid: ${reason}`);
        await this.client.query(sql.updateRequestCreatedToInvalid({ id: this.id, invalid_reason: reason }));
    }

    async verifySuccess(to_amount_atom: bigint) {
        log.debug(`Request id ${this.id} verify success`);
        await this.client.query(sql.updateRequestCreatedToDoneVerify({ id: this.id, to_amount_atom }));
    }

    async verifyError(err_msg: string) {
        log.error(`Request id ${this.id} error in verify: ${err_msg}`);
        await this.client.query(sql.updateRequestCreatedToErrorInVerify({ id: this.id, err_msg }));
    }

    async outgoingCreated(to_txn_hash: string, to_txn_bytes: Uint8Array) {
        log.debug(`Request id ${this.id} outgoing created, txn_hash: ${to_txn_hash}`);
        await this.client.query(sql.updateRequestDoneVerifyToDoingOutgoing({ id: this.id, to_txn_hash, to_txn_bytes }));
    }

    async outgoingSuccess() {
        log.debug(`Request id ${this.id} outgoing success`);
        await this.client.query(sql.updateRequestDoingOutgoingToDoneOutgoing({id: this.id}));
    }

    async outgoingError(err_msg: string) {
        log.debug(`Request id ${this.id} outgoing error: ${err_msg}`);
        await this.client.query(sql.updateRequestDoingOutgoingToErrorInOutgoing({ id: this.id, err_msg }));
    }
}
