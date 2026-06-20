const XLSX = require('xlsx');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'negocio.db');
const EXCEL_PATH = path.join(__dirname, 'ListaPrecios.xlsx');

async function doImport() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets['Precios'];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const parsePrice = (str) => {
    if (!str) return 0;
    const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const productos = rawData.slice(5)
    .filter(row => row[0] && String(row[0]).trim())
    .map(row => ({
      codigo: String(row[0]).trim(),
      nombre: String(row[2]).trim(),
      precio: parsePrice(row[11])
    }));

  console.log(`Found ${productos.length} items in ListaPrecios.xlsx`);

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
    // Insert using both prices as the same for now, or just the one we have
    // The user says there's two, but we only have one column. We'll set both to the same for now to be safe.
    // Or we could set precioNormal to it, and mayoreo to it as well, or 0. Let's do both so it works immediately.
    db.run(
      'INSERT INTO productos (id, codigo, nombre, precioNormal, precioMayoreo, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, p.codigo, p.nombre, p.precio, p.precio, now, now]
    );
    count++;
  }

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  const afterCount = db.exec("SELECT count(*) FROM productos")[0].values[0][0];
  console.log(`Done! DB now has ${afterCount} products.`);
}

doImport().catch(console.error);
