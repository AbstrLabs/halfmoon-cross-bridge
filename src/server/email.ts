import { BridgeTxnObj } from '../bridge';
import { logger } from '../utils/logger';

type EmailAddr = string; // TODO: type this with zod regex
type UID = string; // TODO: type this with zod regex, also apply to BridgeTxn.uid getter
interface Email {
  title: string;
  body: string;
  to: EmailAddr;
}
class EmailServer {
  /**
   * fake interface to send email
   *
   * @param  {Email} email
   * @returns void
   */

  sendEmail(email: Email): void {
    logger.warn(
      `Sending email to ${email.to}, title: ${email.title}, body: ${email.body}`
    );
  }
  sendErrEmail(uid: UID, bridgeTxnObj: BridgeTxnObj): void {
    const email: Email = genAnbErrEmailWithTemplate(uid, bridgeTxnObj);
    this.sendEmail(email);
  }
}

export const emailServer = new EmailServer();

function genAnbErrEmailWithTemplate(
  uid: UID,
  bridgeTxnObj: BridgeTxnObj
): Email {
  return {
    title: `[anb] error: {yyyyMMdd hhmmss}`,
    body:
      `An error of transaction ${uid} needs manual handling. (possibly transfer asset from main acc)` +
      `Details: ${JSON.stringify(bridgeTxnObj)}`,
    to: `anb@abstrlabs.com`, // TODO: use env var
  };
}