const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function run() {
  const DB_PATH = path.join(__dirname, 'data', 'negocio.db');
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  const count = db.exec('SELECT count(*) FROM productos');
  console.log('Count:', JSON.stringify(count));
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', JSON.stringify(tables));
  const sample = db.exec('SELECT * FROM productos LIMIT 5');
  console.log('Sample:', JSON.stringify(sample));
}
run();
