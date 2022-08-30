const { sql } = require('halfmoon-cross-bridge-database');

export class StateMachine {
    constructor(private client: any, private id: number) { }

    async verifyInvalid(reason: string) {
        await this.client.query(sql.updateRequestCreatedToInvalid({ id: this.id, reason }));
    }

    async verifySuccess(to_amount_atom: string) {
        await this.client.query(sql.updateRequestCreatedToDoneVerify({ id: this.id, to_amount_atom }));
    }

    async verifyError(err_msg: string) {
        await this.client.query(sql.updateRequestCreatedToErrorInVerify({ id: this.id, err_msg }));
    }

    async outgoingCreated(to_txn_hash: string, to_txn_bytes: Uint8Array) {
        await this.client.query(sql.updateRequestDoneVerifyToDoingOutgoing({ id: this.id, to_txn_hash, to_txn_bytes }));
    }

    async outgoingSuccess() {
        await this.client.query(sql.updateRequestDoingOutgoingToDoneOutgoing({id: this.id}));
    }

    async outgoingError(err_msg: string) {
        await this.client.query(sql.updateRequestDoingOutgoingToErrorInOutgoing({ id: this.id, err_msg }));
    }
}
