import { BridgeTxnSafeObj } from '../bridge';
import { TxnUid } from '../common/src/type/cross-module';
import { log } from './log/log-template';

type EmailAddr = string; // TODO: type this with zod regex

interface Email {
  title: string;
  body: string;
  to: EmailAddr;
}

class EmailServer {
  /**
   * fake interface to send email
   *
   * @param email - An email object of type {@link Email}
   */

  sendEmail(email: Email): void {
    log.EMLS.onSendEmail(
      email.to,
      email.title,
      `[FAKE] No email is sent here. body: ${email.body}`
    );
  }
  sendErrEmail(uid: TxnUid, bridgeTxnSafeObj: BridgeTxnSafeObj): void {
    const email: Email = genAnbErrEmailWithTemplate(uid, bridgeTxnSafeObj);
    this.sendEmail(email);
  }
}

export const emailServer = new EmailServer();

function genAnbErrEmailWithTemplate(
  uid: TxnUid,
  bridgeTxnObj: BridgeTxnSafeObj
): Email {
  return {
    title: `[anb] error: {yyyyMMdd hhmmss}`,
    body:
      `An error of transaction ${uid} needs manual handling. (possibly transfer asset from main acc)` +
      `Details: ${JSON.stringify(bridgeTxnObj)}`,
    to: `anb@abstrlabs.com`, // TODO: use env var
  };
}
