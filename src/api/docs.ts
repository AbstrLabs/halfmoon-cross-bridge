export { docsRoute };
import express from 'express';

const docsRoute = express.Router();

docsRoute.route('/docs');
// .get((req: Request, res: Response) => {
//   res.sendFile(`${__dirname}/../../docs/index.html`);
// });

docsRoute.use('/docs', express.static(`${__dirname}/../../docs`));
