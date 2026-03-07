const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// La base de datos se guarda en una carpeta "data" dentro del proyecto
const DB_PATH = path.join(__dirname, '..', 'data', 'negocio.db');

// Crear directorio de datos si no existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

// Guardar la base de datos al disco automáticamente
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Auto-guardar cada 5 segundos como respaldo
setInterval(() => {
  saveDatabase();
}, 5000);

// Guardar al cerrar el proceso
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(0); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(0); });

async function initDatabase() {
  const SQL = await initSqlJs();

  // Cargar base de datos existente o crear nueva
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Base de datos cargada desde disco');
  } else {
    db = new SQL.Database();
    console.log('🆕 Nueva base de datos creada');
  }

  // Activar foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // ========== CREAR TABLAS ==========
  db.run(`
    CREATE TABLE IF NOT EXISTS notas (
      id TEXT PRIMARY KEY,
      numeroNota TEXT NOT NULL UNIQUE,
      fecha TEXT NOT NULL,
      clienteNombre TEXT NOT NULL,
      clienteDomicilio TEXT DEFAULT '',
      clienteTelefono TEXT DEFAULT '',
      total REAL DEFAULT 0,
      terminada INTEGER DEFAULT 0,
      pagada INTEGER DEFAULT 0,
      entregada INTEGER DEFAULT 0,
      asignadoA TEXT DEFAULT NULL,
      viaWhatsapp INTEGER DEFAULT 0,
      eliminada INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items_nota (
      id TEXT PRIMARY KEY,
      notaId TEXT NOT NULL,
      cantidad INTEGER DEFAULT 0,
      descripcion TEXT DEFAULT '',
      precioUnitario REAL DEFAULT 0,
      importe REAL DEFAULT 0,
      ordenIndex INTEGER DEFAULT 0,
      FOREIGN KEY (notaId) REFERENCES notas(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS abonos (
      id TEXT PRIMARY KEY,
      notaId TEXT NOT NULL,
      fecha TEXT NOT NULL,
      monto REAL NOT NULL,
      nota TEXT DEFAULT NULL,
      FOREIGN KEY (notaId) REFERENCES notas(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS imagenes_referencia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notaId TEXT NOT NULL,
      imagenData TEXT NOT NULL,
      ordenIndex INTEGER DEFAULT 0,
      FOREIGN KEY (notaId) REFERENCES notas(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS disenadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contador (
      clave TEXT PRIMARY KEY,
      valor INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Insertar diseñadores por defecto si la tabla está vacía
  const countDisenadores = db.exec('SELECT COUNT(*) as count FROM disenadores');
  if (countDisenadores[0].values[0][0] === 0) {
    const defaults = ['Elian', 'Hashly', 'Sofia'];
    for (const nombre of defaults) {
      db.run('INSERT INTO disenadores (nombre) VALUES (?)', [nombre]);
    }
  }

  // Insertar contador por defecto
  const countContador = db.exec("SELECT COUNT(*) as count FROM contador WHERE clave = 'nota'");
  if (countContador[0].values[0][0] === 0) {
    db.run("INSERT INTO contador (clave, valor) VALUES ('nota', 0)");
  }

  // Migración para añadir columna eliminada si ya existía la DB
  try {
    db.run('ALTER TABLE notas ADD COLUMN eliminada INTEGER DEFAULT 0');
  } catch (e) {
    // La columna ya existe, ignorar el error
  }

  saveDatabase();
  console.log('✅ Tablas de base de datos inicializadas');
  return db;
}

// ========== HELPERS ==========

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

// ========== FUNCIONES DE NOTAS ==========

function getNextNumeroNota() {
  db.run("UPDATE contador SET valor = valor + 1 WHERE clave = 'nota'");
  const row = queryOne("SELECT valor FROM contador WHERE clave = 'nota'");
  return row.valor.toString().padStart(5, '0');
}

function enrichNota(nota) {
  const items = queryAll('SELECT * FROM items_nota WHERE notaId = ? ORDER BY ordenIndex ASC', [nota.id]);
  const abonos = queryAll('SELECT * FROM abonos WHERE notaId = ? ORDER BY fecha ASC', [nota.id]);
  const imagenes = queryAll('SELECT imagenData FROM imagenes_referencia WHERE notaId = ? ORDER BY ordenIndex ASC', [nota.id]);

  return {
    ...nota,
    terminada: !!nota.terminada,
    pagada: !!nota.pagada,
    entregada: !!nota.entregada,
    viaWhatsapp: !!nota.viaWhatsapp,
    eliminada: !!nota.eliminada,
    items: items,
    abonos: abonos,
    imagenesReferencia: imagenes.map(i => i.imagenData),
  };
}

function getAllNotas() {
  const notas = queryAll('SELECT * FROM notas WHERE eliminada = 0 ORDER BY createdAt DESC');
  return notas.map(nota => enrichNota(nota));
}

function getNotaById(id) {
  const nota = queryOne('SELECT * FROM notas WHERE id = ?', [id]);
  if (!nota) return null;
  return enrichNota(nota);
}

function createNota(data) {
  const id = crypto.randomUUID();
  const numeroNota = getNextNumeroNota();
  const now = new Date().toISOString();

  db.run(`
    INSERT INTO notas (id, numeroNota, fecha, clienteNombre, clienteDomicilio, clienteTelefono, total, terminada, pagada, entregada, asignadoA, viaWhatsapp, eliminada, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, numeroNota, data.fecha, data.clienteNombre,
    data.clienteDomicilio || '', data.clienteTelefono || '',
    data.total || 0,
    data.terminada ? 1 : 0, data.pagada ? 1 : 0, data.entregada ? 1 : 0,
    data.asignadoA || null, data.viaWhatsapp ? 1 : 0, 0,
    now, now
  ]);

  // Insertar items
  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      db.run(`
        INSERT INTO items_nota (id, notaId, cantidad, descripcion, precioUnitario, importe, ordenIndex)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id || crypto.randomUUID(), id, item.cantidad || 0,
        item.descripcion || '', item.precioUnitario || 0,
        item.importe || 0, index
      ]);
    });
  }

  // Insertar imágenes de referencia
  if (data.imagenesReferencia && data.imagenesReferencia.length > 0) {
    data.imagenesReferencia.forEach((img, index) => {
      db.run(`
        INSERT INTO imagenes_referencia (notaId, imagenData, ordenIndex) VALUES (?, ?, ?)
      `, [id, img, index]);
    });
  }

  // Insertar abonos
  if (data.abonos && data.abonos.length > 0) {
    data.abonos.forEach(abono => {
      db.run(`
        INSERT INTO abonos (id, notaId, fecha, monto, nota) VALUES (?, ?, ?, ?, ?)
      `, [
        abono.id || crypto.randomUUID(), id,
        abono.fecha, abono.monto, abono.nota || null
      ]);
    });
  }

  saveDatabase();
  return getNotaById(id);
}

function updateNota(id, updates) {
  const nota = queryOne('SELECT * FROM notas WHERE id = ?', [id]);
  if (!nota) return null;

  const now = new Date().toISOString();

  // Campos simples
  const simpleFields = ['fecha', 'clienteNombre', 'clienteDomicilio', 'clienteTelefono', 'total', 'asignadoA'];
  const boolFields = ['terminada', 'pagada', 'entregada', 'viaWhatsapp', 'eliminada'];

  const setClauses = ['updatedAt = ?'];
  const values = [now];

  for (const field of simpleFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  for (const field of boolFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field] ? 1 : 0);
    }
  }

  values.push(id);
  db.run(`UPDATE notas SET ${setClauses.join(', ')} WHERE id = ?`, values);

  // Actualizar items si se proporcionan
  if (updates.items !== undefined) {
    db.run('DELETE FROM items_nota WHERE notaId = ?', [id]);
    if (updates.items.length > 0) {
      updates.items.forEach((item, index) => {
        db.run(`
          INSERT INTO items_nota (id, notaId, cantidad, descripcion, precioUnitario, importe, ordenIndex)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          item.id || crypto.randomUUID(), id, item.cantidad || 0,
          item.descripcion || '', item.precioUnitario || 0,
          item.importe || 0, index
        ]);
      });
    }
  }

  // Actualizar imágenes si se proporcionan
  if (updates.imagenesReferencia !== undefined) {
    db.run('DELETE FROM imagenes_referencia WHERE notaId = ?', [id]);
    if (updates.imagenesReferencia.length > 0) {
      updates.imagenesReferencia.forEach((img, index) => {
        db.run(`
          INSERT INTO imagenes_referencia (notaId, imagenData, ordenIndex) VALUES (?, ?, ?)
        `, [id, img, index]);
      });
    }
  }

  // Actualizar abonos si se proporcionan
  if (updates.abonos !== undefined) {
    db.run('DELETE FROM abonos WHERE notaId = ?', [id]);
    if (updates.abonos.length > 0) {
      updates.abonos.forEach(abono => {
        db.run(`
          INSERT INTO abonos (id, notaId, fecha, monto, nota) VALUES (?, ?, ?, ?, ?)
        `, [
          abono.id || crypto.randomUUID(), id,
          abono.fecha, abono.monto, abono.nota || null
        ]);
      });
    }
  }

  saveDatabase();
  return getNotaById(id);
}

// ========== FUNCIONES DE DISEÑADORES ==========

function getDisenadores() {
  return queryAll('SELECT nombre FROM disenadores ORDER BY nombre ASC').map(d => d.nombre);
}

function addDisenador(nombre) {
  try {
    db.run('INSERT INTO disenadores (nombre) VALUES (?)', [nombre]);
    saveDatabase();
    return true;
  } catch (e) {
    return false;
  }
}

function updateDisenador(oldNombre, newNombre) {
  const existing = queryOne('SELECT * FROM disenadores WHERE nombre = ?', [oldNombre]);
  if (!existing) return false;
  
  db.run('UPDATE disenadores SET nombre = ? WHERE nombre = ?', [newNombre, oldNombre]);
  db.run('UPDATE notas SET asignadoA = ? WHERE asignadoA = ?', [newNombre, oldNombre]);
  saveDatabase();
  return true;
}

function deleteDisenador(nombre) {
  const count = queryOne('SELECT COUNT(*) as count FROM disenadores');
  if (count.count <= 1) return false;
  
  const existing = queryOne('SELECT * FROM disenadores WHERE nombre = ?', [nombre]);
  if (!existing) return false;
  
  db.run('DELETE FROM disenadores WHERE nombre = ?', [nombre]);
  saveDatabase();
  return true;
}

module.exports = {
  initDatabase,
  getAllNotas,
  getNotaById,
  createNota,
  updateNota,
  getDisenadores,
  addDisenador,
  updateDisenador,
  deleteDisenador,
};
