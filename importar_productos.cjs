/**
 * Script de importación de productos desde el Excel RepExistencias2.xlsx
 * Importa clave y descripción. Los precios quedarán en 0 para que se llenen manualmente.
 * Ejecutar con: node importar_productos.cjs
 */

const XLSX = require('xlsx');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'negocio.db');
const EXCEL_PATH = path.join(__dirname, 'RepExistencias2.xlsx');

async function importar() {
  // 1. Leer el Excel
  console.log('📂 Leyendo Excel:', EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Los datos de productos comienzan en la fila 5 (índice 4 = encabezados, índice 5+ = datos)
  // Columna 0 = Clave, Columna 2 = Descripción
  const productos = rawData
    .slice(5)
    .filter(row => row[0] && String(row[0]).trim() && row[2] && String(row[2]).trim())
    .map(row => ({
      codigo: String(row[0]).trim(),
      nombre: String(row[2]).trim(),
    }));

  console.log(`✅ Se encontraron ${productos.length} productos en el Excel.`);

  // 2. Abrir la base de datos
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ No se encontró la base de datos en:', DB_PATH);
    console.error('   Asegúrate de haber iniciado el servidor al menos una vez para crear la BD.');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Crear la tabla productos si no existe
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
  // Migración: añadir precioNormal si ya existía sin esa columna
  try { db.run('ALTER TABLE productos ADD COLUMN precioNormal REAL DEFAULT 0'); } catch(e) {}
  console.log('✅ Tabla productos verificada/creada.');

  // 3. Contar cuántos ya existen para no duplicar
  const existingCodes = new Set();
  const existingRows = db.exec("SELECT codigo FROM productos WHERE codigo != ''");
  if (existingRows.length > 0 && existingRows[0].values) {
    existingRows[0].values.forEach(row => existingCodes.add(row[0]));
  }

  console.log(`📊 Productos ya en la base de datos: ${existingCodes.size}`);

  // 4. Insertar los que no existan
  let insertados = 0;
  let omitidos = 0;
  const now = new Date().toISOString();

  const stmt = db.prepare(
    'INSERT INTO productos (id, codigo, nombre, precioNormal, precioMayoreo, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  for (const p of productos) {
    if (existingCodes.has(p.codigo)) {
      omitidos++;
      continue;
    }
    const id = crypto.randomUUID();
    stmt.run([id, p.codigo, p.nombre, 0, 0, now, now]);
    insertados++;
  }

  stmt.free();

  // 5. Guardar la base de datos
  const data = db.export();
  const buffer = Buffer.from(data);
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, buffer);
  fs.renameSync(tempPath, DB_PATH);
  db.close();

  console.log('');
  console.log('=== RESUMEN DE IMPORTACIÓN ===');
  console.log(`✅ Productos insertados:  ${insertados}`);
  console.log(`⏩ Productos omitidos (ya existían): ${omitidos}`);
  console.log('');
  console.log('📌 NOTA: Los precios quedaron en $0.00. Puedes editarlos desde el Catálogo de Productos del sistema.');
  console.log('');
  console.log('🎉 ¡Importación completada exitosamente!');
}

importar().catch(err => {
  console.error('❌ Error durante la importación:', err);
  process.exit(1);
});
