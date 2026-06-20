const XLSX = require('xlsx');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'negocio.db');
const EXCEL_PATH = path.join(__dirname, 'ListaPrecios (1).xlsx');

async function doImport() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets['PreciosM'];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const parsePrice = str => {
    if (!str || str === '-') return null;
    const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  };

  const productos = [];
  for (let i = 5; i < rawData.length; i++) {
    const row = rawData[i];
    const clave = row[0] ? String(row[0]).trim() : '';
    const desc = row[3] ? String(row[3]).trim() : '';
    
    if (clave && desc && clave !== desc) {
      const pNormal = parsePrice(row[8]) || 0;
      let pMayoreo = parsePrice(row[12]);
      if (pMayoreo === null) pMayoreo = parsePrice(row[11]);
      if (pMayoreo === null) pMayoreo = pNormal;
      
      productos.push({ codigo: clave, nombre: desc, precioNormal: pNormal, precioMayoreo: pMayoreo });
    }
  }

  console.log(`Found ${productos.length} items in ListaPrecios (1).xlsx`);

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  // Create table if not exists just in case
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id TEXT PRIMARY KEY,
      codigo TEXT DEFAULT '',
      nombre TEXT NOT NULL,
      precioNormal REAL DEFAULT 0,
      precioMayoreo REAL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.run("DELETE FROM productos"); // clear to ensure a fresh import

  let count = 0;
  for (const p of productos) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.run(
      'INSERT INTO productos (id, codigo, nombre, precioNormal, precioMayoreo, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, p.codigo, p.nombre, p.precioNormal, p.precioMayoreo, now, now]
    );
    count++;
  }

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  const afterCount = db.exec("SELECT count(*) FROM productos")[0].values[0][0];
  console.log(`Done! DB now has ${afterCount} products with updated wholesale prices.`);
}

doImport().catch(console.error);
