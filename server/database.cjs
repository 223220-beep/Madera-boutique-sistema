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

// Función para crear respaldos automáticos
function createBackup() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `negocio_backup_${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`🛡️ Respaldo automático creado: ${backupPath}`);

    // Mantener solo los últimos 20 respaldos
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('negocio_backup_'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 20) {
      files.slice(20).forEach(f => fs.unlinkSync(path.join(backupDir, f.name)));
    }
  }
}

async function initDatabase() {
  // Crear respaldo al iniciar
  createBackup();

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
      clienteTelefono TEXT DEFAULT '',
      fechaEvento TEXT DEFAULT '',
      fechaEntrega TEXT DEFAULT '',
      total REAL DEFAULT 0,
      terminada INTEGER DEFAULT 0,
      pagada INTEGER DEFAULT 0,
      entregada INTEGER DEFAULT 0,
      asignadoA TEXT DEFAULT NULL,
      urgente INTEGER DEFAULT 0,
      viaWhatsapp INTEGER DEFAULT 0,
      pagaAlRecibir INTEGER DEFAULT 0,
      eliminada INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Add pagaAlRecibir column if it doesn't exist
  try {
    db.run("ALTER TABLE notas ADD COLUMN pagaAlRecibir INTEGER DEFAULT 0");
  } catch (e) {
    // Column already exists
  }

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

  // Migración para añadir columna eliminada y nuevas fechas si ya existía la DB
  try {
    db.run('ALTER TABLE notas ADD COLUMN eliminada INTEGER DEFAULT 0');
  } catch (e) {
    // La columna ya existe, ignorar el error
  }
  try {
    db.run('ALTER TABLE notas ADD COLUMN fechaEvento TEXT DEFAULT ""');
    db.run('ALTER TABLE notas ADD COLUMN fechaEntrega TEXT DEFAULT ""');
  } catch (e) {
    // Las columnas ya existen, ignorar el error
  }
  try {
    db.run('ALTER TABLE notas ADD COLUMN urgente INTEGER DEFAULT 0');
  } catch (e) {
  }
  try {
    db.run('ALTER TABLE items_nota ADD COLUMN terminado INTEGER DEFAULT 0');
    db.run('ALTER TABLE items_nota ADD COLUMN entregado INTEGER DEFAULT 0');
  } catch (e) {
  }
  try {
    db.run('ALTER TABLE notas ADD COLUMN disenadoresTerminados TEXT DEFAULT "[]"');
  } catch (e) {
  }
  try {
    db.run('ALTER TABLE notas ADD COLUMN comentarios TEXT DEFAULT ""');
  } catch (e) {
  }

  saveDatabase();
  console.log('✅ Tablas de base de datos inicializadas');
  return db;
}

// ========== HELPERS ==========

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    return results;
  } finally {
    stmt.free();
  }
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

  let asignadoArreglo = [];
  if (nota.asignadoA) {
    try {
      asignadoArreglo = JSON.parse(nota.asignadoA);
      if (!Array.isArray(asignadoArreglo)) {
        asignadoArreglo = [nota.asignadoA]; // Fallback for pure strings mimicking JSON
      }
    } catch {
      asignadoArreglo = [nota.asignadoA]; // Fallback for old legacy string data
    }
  }

  let disenadoresTerminados = [];
  if (nota.disenadoresTerminados) {
    try {
      disenadoresTerminados = JSON.parse(nota.disenadoresTerminados);
      if (!Array.isArray(disenadoresTerminados)) disenadoresTerminados = [];
    } catch {
      disenadoresTerminados = [];
    }
  }

  return {
    ...nota,
    terminada: !!nota.terminada,
    pagada: !!nota.pagada,
    entregada: !!nota.entregada,
    viaWhatsapp: !!nota.viaWhatsapp,
    pagaAlRecibir: !!nota.pagaAlRecibir,
    eliminada: !!nota.eliminada,
    urgente: !!nota.urgente,
    asignadoA: asignadoArreglo,
    disenadoresTerminados: disenadoresTerminados,
    items: items.map(i => ({ ...i, terminado: !!i.terminado, entregado: !!i.entregado })),
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
    INSERT INTO notas (id, numeroNota, fecha, clienteNombre, clienteTelefono, fechaEvento, fechaEntrega, total, comentarios, terminada, pagada, entregada, asignadoA, urgente, viaWhatsapp, pagaAlRecibir, eliminada, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, numeroNota, data.fecha, data.clienteNombre,
    data.clienteTelefono || '', data.fechaEvento || '', data.fechaEntrega || '',
    data.total || 0, data.comentarios || '',
    data.terminada ? 1 : 0, data.pagada ? 1 : 0, data.entregada ? 1 : 0,
    data.asignadoA && Array.isArray(data.asignadoA) && data.asignadoA.length > 0 ? JSON.stringify(data.asignadoA) : null,
    data.urgente ? 1 : 0,
    data.viaWhatsapp ? 1 : 0,
    data.pagaAlRecibir ? 1 : 0, 0,
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
  const simpleFields = ['fecha', 'clienteNombre', 'clienteTelefono', 'fechaEvento', 'fechaEntrega', 'total', 'comentarios'];
  const boolFields = ['terminada', 'pagada', 'entregada', 'urgente', 'viaWhatsapp', 'pagaAlRecibir', 'eliminada'];

  const setClauses = ['updatedAt = ?'];
  const values = [now];

  if (updates.asignadoA !== undefined) {
    setClauses.push('asignadoA = ?');
    values.push(updates.asignadoA && Array.isArray(updates.asignadoA) && updates.asignadoA.length > 0 ? JSON.stringify(updates.asignadoA) : null);
  }

  if (updates.disenadoresTerminados !== undefined) {
    setClauses.push('disenadoresTerminados = ?');
    values.push(updates.disenadoresTerminados && Array.isArray(updates.disenadoresTerminados) ? JSON.stringify(updates.disenadoresTerminados) : "[]");
  }

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

  // Automatización: Si la nota está marcada como pagada pero tiene saldo pendiente, liquidar
  // Omitimos esto si el usuario ya está proporcionando los abonos manualmente en el mismo update
  const notaFinal = queryOne('SELECT pagada, total FROM notas WHERE id = ?', [id]);
  if (notaFinal && notaFinal.pagada && updates.abonos === undefined) {
    const currentAbonos = queryAll('SELECT monto FROM abonos WHERE notaId = ?', [id]);
    const totalAbonado = currentAbonos.reduce((sum, a) => sum + (Number(a.monto) || 0), 0);
    const totalActual = Number(notaFinal.total);
    
    if (totalActual > (totalAbonado + 0.01)) {
      const restante = totalActual - totalAbonado;
      db.run(`
        INSERT INTO abonos (id, notaId, fecha, monto, nota)
        VALUES (?, ?, ?, ?, ?)
      `, [crypto.randomUUID(), id, now, restante, 'Liquidación (Automática)']);
    }
  }

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

function getReporteCaja() {
  const sql = `
    SELECT 
      a.*, 
      n.numeroNota, 
      n.clienteNombre 
    FROM abonos a
    JOIN notas n ON a.notaId = n.id
    ORDER BY a.fecha DESC
  `;
  return queryAll(sql);
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
  
  // Custom update for JSON array of asignadoA
  const affectedNotes = queryAll(`SELECT id, asignadoA FROM notas WHERE asignadoA LIKE '%' || ? || '%'`, [oldNombre]);
  affectedNotes.forEach(nota => {
    try {
      let arr = JSON.parse(nota.asignadoA);
      if (!Array.isArray(arr)) arr = [nota.asignadoA];
      const updatedArr = arr.map(e => e === oldNombre ? newNombre : e);
      db.run('UPDATE notas SET asignadoA = ? WHERE id = ?', [JSON.stringify(updatedArr), nota.id]);
    } catch {
      if (nota.asignadoA === oldNombre) {
        db.run('UPDATE notas SET asignadoA = ? WHERE id = ?', [JSON.stringify([newNombre]), nota.id]);
      }
    }
  });

  saveDatabase();
  return true;
}

function deleteDisenador(nombre) {
  const count = queryOne('SELECT COUNT(*) as count FROM disenadores');
  if (count.count <= 1) return false;
  
  const existing = queryOne('SELECT * FROM disenadores WHERE nombre = ?', [nombre]);
  if (!existing) return false;
  
  db.run('DELETE FROM disenadores WHERE nombre = ?', [nombre]);

  // Remove designer from arrays
  const affectedNotes = queryAll(`SELECT id, asignadoA FROM notas WHERE asignadoA LIKE '%' || ? || '%'`, [nombre]);
  affectedNotes.forEach(nota => {
    try {
      let arr = JSON.parse(nota.asignadoA);
      if (!Array.isArray(arr)) arr = [nota.asignadoA];
      const updatedArr = arr.filter(e => e !== nombre);
      if (updatedArr.length === 0) {
        db.run('UPDATE notas SET asignadoA = NULL WHERE id = ?', [nota.id]);
      } else {
        db.run('UPDATE notas SET asignadoA = ? WHERE id = ?', [JSON.stringify(updatedArr), nota.id]);
      }
    } catch {
      if (nota.asignadoA === nombre) {
        db.run('UPDATE notas SET asignadoA = NULL WHERE id = ?', [nota.id]);
      }
    }
  });

  saveDatabase();
  return true;
}

function updateItem(itemId, updates) {
  const setClauses = [];
  const values = [];

  if (updates.terminado !== undefined) {
    setClauses.push('terminado = ?');
    values.push(updates.terminado ? 1 : 0);
  }
  if (updates.entregado !== undefined) {
    setClauses.push('entregado = ?');
    values.push(updates.entregado ? 1 : 0);
  }

  if (setClauses.length === 0) return false;

  values.push(itemId);
  db.run(`UPDATE items_nota SET ${setClauses.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  return true;
}

module.exports = {
  initDatabase,
  getAllNotas,
  getNotaById,
  createNota,
  updateNota,
  updateItem,
  getDisenadores,
  addDisenador,
  updateDisenador,
  deleteDisenador,
  getReporteCaja,
};
