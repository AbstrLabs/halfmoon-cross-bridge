import { BridgeTxnSafeObj } from '../bridge';
import { logger } from '../utils/logger';
import { TxnUid } from '../utils/type/type';

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
    logger.warn(
      `[EMS]: FAKE! Sending email to ${email.to}, title: ${email.title}, body: ${email.body}`
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