export { docsRoute };
import express from 'express';

const docsRoute = express.Router();

docsRoute.route('/docs');

docsRoute.use('/docs', express.static(`${__dirname}/../../TSDoc`));
