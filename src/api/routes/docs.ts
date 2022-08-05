import express from 'express';

export const docsRoute = express.Router().use('/', express.static(`${__dirname}/../../../TSDoc`));
