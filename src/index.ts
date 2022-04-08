import { Request, Response } from 'express';

import express from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.sendFile('example-frontend.html', { root: __dirname });
});

app.listen(3000, () => {
  console.log('Application started on port 3000! http://localhost:3000/');
});
