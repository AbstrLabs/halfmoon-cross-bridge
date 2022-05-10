import { db } from '../../database/db';

module.exports = async function () {
  await db.end();
  console.log('teardown ended');
};
