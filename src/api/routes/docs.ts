export { docsRoute };
import express from 'express';

const docsRoute = express.Router();

docsRoute.route('/docs');

docsRoute.use('/docs', express.static(`${__dirname}/../../TSDoc`));

// docsRoute.use('/docs', express.static(`${__dirname}/../../TSdoc`));

// docsRoute.route('/docs').get((req, res) => {
//   console.log('getting docs '); // DEV_LOG_TO_REMOVE
// });
