import Nedb from 'nedb';

export { nedb };

const nedb = new Nedb({
  filename: './src/database/nedb.jsonb',
  autoload: true,
});
nedb.loadDatabase();
