const { sql } = require('artificio-bridge-database');

export class StateMachine {
    constructor(private client: any) { }

    async verifyInvalid(reason: string) {
        await this.client.query(sql.updateRequestCreatedToInvalid({ reason }));
    }

    async verifySuccess(to_amount_atom: string) {
        await this.client.query(sql.updateRequestCreatedToDoneVerify({ to_amount_atom }));
    }

    async verifyError(errorMsg: string) {
        await this.client.query(sql.updateRequestCreatedToErrorInVerify({ errorMsg }));
    }

    async outgoingCreated(to_txn_hash: string, to_txn_bytes: Uint8Array) {
        await this.client.query(sql.updateRequestDoneVerifyToDoingOutgoing({ to_txn_hash, to_txn_bytes }));
    }

    async outgoingSuccess() {
        await this.client.query(sql.updateRequestDoingOutgoingToDoneOutgoing());
    }

    async outgoingError(errorMsg: string) {
        await this.client.query(sql.updateRequestDoingOutgoingToErrorInOutgoing({ errorMsg }));
    }
}
