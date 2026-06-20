/**
 * Script de actualización de precios desde ListaPrecios.xlsx
 * Actualiza el precioNormal de los productos existentes en base a la Clave
 * Ejecutar con: node actualizar_precios.cjs
 */

const XLSX = require('xlsx');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'negocio.db');
const EXCEL_PATH = path.join(__dirname, 'ListaPrecios.xlsx');

async function actualizar() {
  console.log('📂 Leyendo Excel de precios:', EXCEL_PATH);
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ No se encontró el archivo', EXCEL_PATH);
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Parsear precios (quitar el signo $ y comas, convertir a número)
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanStr = String(priceStr).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const preciosMap = new Map();
  // Datos empiezan en la fila 5 (índice 4 = headers, 5 = primer dato)
  // Columna 0 = Clave, Columna 11 = Precio
  rawData.slice(5).forEach(row => {
    const clave = row[0] ? String(row[0]).trim() : '';
    const precioNormal = parsePrice(row[11]);
    if (clave) {
      preciosMap.set(clave, precioNormal);
    }
  });

  console.log(`✅ Se leyeron ${preciosMap.size} precios del Excel.`);

  // 2. Abrir la base de datos
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ No se encontró la base de datos en:', DB_PATH);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // 3. Actualizar productos
  let actualizados = 0;
  let noEncontrados = 0;
  const now = new Date().toISOString();

  const updateStmt = db.prepare('UPDATE productos SET precioNormal = ?, updatedAt = ? WHERE codigo = ?');

  // Obtener todos los productos para verificar
  const existingRows = db.exec("SELECT codigo FROM productos");
  const existingCodes = new Set();
  if (existingRows.length > 0 && existingRows[0].values) {
    existingRows[0].values.forEach(row => existingCodes.add(row[0]));
  }

  for (const [clave, precio] of preciosMap.entries()) {
    if (existingCodes.has(clave)) {
      updateStmt.run([precio, now, clave]);
      actualizados++;
    } else {
      noEncontrados++;
    }
  }

  updateStmt.free();

  // 4. Guardar la base de datos
  if (actualizados > 0) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, DB_PATH);
    db.close();
  }

  console.log('');
  console.log('=== RESUMEN DE ACTUALIZACIÓN ===');
  console.log(`✅ Productos actualizados (precioNormal): ${actualizados}`);
  if (noEncontrados > 0) {
    console.log(`⏩ Precios omitidos (producto no en BD): ${noEncontrados}`);
  }
  console.log('');
  console.log('🎉 ¡Actualización de precios completada!');
}

actualizar().catch(err => {
  console.error('❌ Error durante la actualización:', err);
  process.exit(1);
});
